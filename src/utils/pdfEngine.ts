import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { ImageToPdfSettings, PdfAnnotation, PdfToImageSettings } from '../types';

// Configure pdfjs worker URL
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

// Convert mm to PDF points (1 inch = 72 points = 25.4 mm)
const mmToPoints = (mm: number) => (mm / 25.4) * 72;

// Standard page dimensions in points (width, height)
const PAGE_SIZES = {
  A4: [595.28, 841.89], // 210 x 297 mm
  Letter: [612, 792], // 8.5 x 11 inches
};

/**
 * Convert multiple image files into a single PDF document
 */
export async function convertImagesToPdf(
  files: File[],
  settings: ImageToPdfSettings
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const isPng = file.type === 'image/png';
    
    let image;
    try {
      if (isPng) {
        image = await pdfDoc.embedPng(arrayBuffer);
      } else {
        image = await pdfDoc.embedJpg(arrayBuffer);
      }
    } catch {
      // Fallback: draw through canvas convert to JPG if format embedding fails
      const imgDataUrl = await fileToDataUrl(file);
      const canvas = await dataUrlToCanvas(imgDataUrl);
      const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const jpgBytes = dataUrlToUint8Array(jpgDataUrl);
      image = await pdfDoc.embedJpg(jpgBytes);
    }

    let pageWidth: number;
    let pageHeight: number;

    if (settings.pageSize === 'Fit') {
      pageWidth = image.width + mmToPoints(settings.marginMm) * 2;
      pageHeight = image.height + mmToPoints(settings.marginMm) * 2;
    } else {
      const [w, h] = PAGE_SIZES[settings.pageSize] || PAGE_SIZES.A4;
      if (settings.orientation === 'landscape') {
        pageWidth = h;
        pageHeight = w;
      } else {
        pageWidth = w;
        pageHeight = h;
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const margin = mmToPoints(settings.marginMm);

    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    // Calculate aspect ratio preserving dimensions
    const imgRatio = image.width / image.height;
    const boxRatio = availableWidth / availableHeight;

    let drawWidth = availableWidth;
    let drawHeight = availableHeight;

    if (imgRatio > boxRatio) {
      drawHeight = availableWidth / imgRatio;
    } else {
      drawWidth = availableHeight * imgRatio;
    }

    const x = margin + (availableWidth - drawWidth) / 2;
    const y = margin + (availableHeight - drawHeight) / 2;

    page.drawImage(image, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * Render PDF Pages as Images (PDF to Image)
 */
export async function convertPdfToImages(
  pdfBuffer: ArrayBuffer,
  settings: PdfToImageSettings
): Promise<{ pageIndex: number; dataUrl: string; blob: Blob }[]> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  // Parse page range
  const targetPages = parsePageRange(settings.pageRange, totalPages);
  const results: { pageIndex: number; dataUrl: string; blob: Blob }[] = [];

  // Scale factor based on DPI: 72 DPI = 1.0, 150 DPI = 2.08, 300 DPI = 4.16
  const scale = settings.dpi / 72;

  for (const pageNum of targetPages) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas as any,
    }).promise;

    const mimeType = settings.format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, 0.95);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), mimeType, 0.95)
    );

    results.push({
      pageIndex: pageNum - 1,
      dataUrl,
      blob,
    });
  }

  return results;
}

/**
 * Render a single PDF Page to an HTML Canvas element
 */
export async function renderPdfPageToCanvas(
  pdfBuffer: ArrayBuffer,
  pageIndex: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
): Promise<void> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdf = await loadingTask.promise;
  if (pageIndex < 0 || pageIndex >= pdf.numPages) return;

  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport: viewport,
    canvas: canvas as any,
  }).promise;
}

/**
 * Manipulate PDF Pages: rotate, reorder, delete, and add annotations
 */
export async function processPdfDocument(
  pdfBuffer: ArrayBuffer,
  pageRotations: Map<number, number>, // pageIndex -> rotation delta (0, 90, 180, 270)
  pageOrder: number[], // list of page indices in new order
  annotations: PdfAnnotation[] = []
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const newDoc = await PDFDocument.create();

  const font = await newDoc.embedFont(StandardFonts.Helvetica);

  // Copy pages in specified order
  for (let i = 0; i < pageOrder.length; i++) {
    const srcIndex = pageOrder[i];
    const [copiedPage] = await newDoc.copyPages(srcDoc, [srcIndex]);
    
    // Apply additional rotation if set
    const extraRot = pageRotations.get(srcIndex) || 0;
    if (extraRot !== 0) {
      const currentRot = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentRot + extraRot) % 360));
    }

    // Apply annotations for this page
    const pageAnnos = annotations.filter((a) => a.pageIndex === srcIndex);
    const { width: pWidth, height: pHeight } = copiedPage.getSize();

    for (const anno of pageAnnos) {
      const xPt = (anno.x / 100) * pWidth;
      const yPt = pHeight - (anno.y / 100) * pHeight; // PDF origin is bottom-left
      const wPt = (anno.width / 100) * pWidth;
      const hPt = (anno.height / 100) * pHeight;

      if (anno.type === 'text' || anno.type === 'date') {
        const textStr = anno.text || (anno.type === 'date' ? new Date().toLocaleDateString() : 'Text');
        const fontSize = anno.fontSize || 14;
        const color = hexToRgb(anno.color || '#000000');

        copiedPage.drawText(textStr, {
          x: xPt,
          y: yPt - fontSize,
          size: fontSize,
          font,
          color,
        });
      } else if (anno.type === 'rectangle' || anno.type === 'redaction') {
        const isRedaction = anno.type === 'redaction';
        const fillColor = isRedaction ? rgb(0, 0, 0) : hexToRgb(anno.fillColor || '#f87171');
        const borderColor = isRedaction ? rgb(0, 0, 0) : hexToRgb(anno.color || '#dc2626');

        copiedPage.drawRectangle({
          x: xPt,
          y: yPt - hPt,
          width: Math.max(10, wPt),
          height: Math.max(10, hPt),
          color: fillColor,
          borderColor: borderColor,
          borderWidth: isRedaction ? 0 : 1,
          opacity: anno.opacity ?? (isRedaction ? 1.0 : 0.8),
        });
      } else if (anno.type === 'highlight') {
        const highlightColor = hexToRgb(anno.fillColor || '#fef08a');
        copiedPage.drawRectangle({
          x: xPt,
          y: yPt - hPt,
          width: Math.max(10, wPt),
          height: Math.max(10, hPt),
          color: highlightColor,
          opacity: 0.45,
        });
      }
    }

    newDoc.addPage(copiedPage);
  }

  return await newDoc.save();
}

/**
 * Extract specific pages into a new PDF
 */
export async function extractPdfPages(
  pdfBuffer: ArrayBuffer,
  pageIndicesToExtract: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const newDoc = await PDFDocument.create();

  const copiedPages = await newDoc.copyPages(srcDoc, pageIndicesToExtract);
  copiedPages.forEach((p) => newDoc.addPage(p));

  return await newDoc.save();
}

/**
 * Merge multiple PDF document buffers into a single PDF
 */
export async function mergePdfFiles(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create();

  for (const buffer of buffers) {
    const doc = await PDFDocument.load(buffer);
    const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach((p) => mergedDoc.addPage(p));
  }

  return await mergedDoc.save();
}

/**
 * Split a PDF document into an array of single-page PDFs
 */
export async function splitPdfIntoPages(
  pdfBuffer: ArrayBuffer
): Promise<{ pageIndex: number; pdfBytes: Uint8Array }[]> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = srcDoc.getPageCount();
  const results: { pageIndex: number; pdfBytes: Uint8Array }[] = [];

  for (let i = 0; i < totalPages; i++) {
    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
    newDoc.addPage(copiedPage);
    const pdfBytes = await newDoc.save();
    results.push({ pageIndex: i, pdfBytes });
  }

  return results;
}

// Helpers
function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          pages.add(i);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pages.add(p);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export function createDownloadLink(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function hexToRgb(hex: string) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return rgb(r / 255, g / 255, b / 255);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
