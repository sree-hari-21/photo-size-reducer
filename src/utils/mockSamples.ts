import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Creates a sample high-resolution photo with graphics on Canvas
 */
export function createSamplePhotoFile(): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Elegant dark gradient background
      const grad = ctx.createLinearGradient(0, 0, 1200, 1200);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 1200);

      // Subtle decorative geometric shapes
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(100, 100, 1000, 1000);

      // Inner portrait emblem
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(600, 500, 240, 0, Math.PI * 2);
      ctx.fill();

      // Portrait silhouette
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(600, 440, 100, 0, Math.PI * 2); // head
      ctx.fill();

      ctx.beginPath();
      ctx.arc(600, 720, 180, Math.PI, 0); // shoulders
      ctx.fill();

      // Badge tag
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFFICIAL IDENTIFICATION SAMPLE', 600, 1050);
    }

    canvas.toBlob((blob) => {
      const file = new File([blob!], 'sample_portrait_hd.jpg', { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg', 0.95);
  });
}

/**
 * Creates a multi-page sample PDF document for instant testing
 */
export async function createSamplePdfFile(): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Page 1: Title & Executive Summary
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  page1.drawRectangle({
    x: 40,
    y: 780,
    width: 515,
    height: 35,
    color: rgb(0.06, 0.49, 0.98),
  });
  page1.drawText('OMNISTUDIO SAMPLE DOCUMENT', {
    x: 50,
    y: 792,
    size: 16,
    font,
    color: rgb(1, 1, 1),
  });

  page1.drawText('Page 1 of 3 - Executive Overview', {
    x: 50,
    y: 740,
    size: 20,
    font,
    color: rgb(0.09, 0.12, 0.22),
  });

  page1.drawText(
    'This sample multi-page PDF document allows you to evaluate all OmniStudio features instantly:\n' +
      '- Page Rotation, Reordering, and Extraction\n' +
      '- Text Annotations & Signature Pad Overlay\n' +
      '- Highlighting & Sensitive Data Redaction\n' +
      '- High-Resolution PDF to Image Conversion\n' +
      '- PDF Document Merging & Splitting',
    {
      x: 50,
      y: 600,
      size: 13,
      font: regularFont,
      color: rgb(0.2, 0.25, 0.35),
      lineHeight: 22,
    }
  );

  // Sample data table graphic box
  page1.drawRectangle({
    x: 50,
    y: 350,
    width: 495,
    height: 180,
    color: rgb(0.95, 0.96, 0.98),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });
  page1.drawText('Sample Confidential Record #84920', {
    x: 70,
    y: 500,
    size: 14,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  page1.drawText('Client Name: Johnathan Q. Public\nAccount ID: 9948-28491-X88\nStatus: VERIFIED & SEALED', {
    x: 70,
    y: 430,
    size: 12,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
    lineHeight: 20,
  });

  // Page 2: Analytical Chart Representation
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  page2.drawText('Page 2 of 3 - Performance & Specifications', {
    x: 50,
    y: 780,
    size: 20,
    font,
    color: rgb(0.09, 0.12, 0.22),
  });

  page2.drawRectangle({
    x: 50,
    y: 500,
    width: 495,
    height: 220,
    color: rgb(0.98, 0.98, 1.0),
    borderColor: rgb(0.7, 0.8, 0.95),
    borderWidth: 1.5,
  });
  page2.drawText('Desktop Architectural Benchmarks', {
    x: 70,
    y: 690,
    size: 15,
    font,
    color: rgb(0.05, 0.35, 0.75),
  });

  const specs = [
    'Tauri + React/TS Binary Size: ~12 MB (vs Electron ~120 MB)',
    'RAM Consumption: ~45 MB Idle (vs Electron ~280 MB)',
    'Local Processing Privacy: 100% Zero-Cloud Executed',
    'PDF Render Speed: Hardware Accelerated HTML5 Canvas',
  ];

  specs.forEach((spec, idx) => {
    page2.drawText(`• ${spec}`, {
      x: 80,
      y: 650 - idx * 30,
      size: 12,
      font: regularFont,
      color: rgb(0.2, 0.25, 0.3),
    });
  });

  // Page 3: Authorization & Signatures
  const page3 = pdfDoc.addPage([595.28, 841.89]);
  page3.drawText('Page 3 of 3 - Sign-off & Verification', {
    x: 50,
    y: 780,
    size: 20,
    font,
    color: rgb(0.09, 0.12, 0.22),
  });

  page3.drawRectangle({
    x: 50,
    y: 550,
    width: 230,
    height: 120,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });
  page3.drawText('Authorized Inspector Signature:', {
    x: 60,
    y: 650,
    size: 11,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  page3.drawRectangle({
    x: 315,
    y: 550,
    width: 230,
    height: 120,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });
  page3.drawText('Date Stamp & Seal:', {
    x: 325,
    y: 650,
    size: 11,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await pdfDoc.save();
  return new File([pdfBytes], 'OmniStudio_Sample_Document.pdf', {
    type: 'application/pdf',
  });
}
