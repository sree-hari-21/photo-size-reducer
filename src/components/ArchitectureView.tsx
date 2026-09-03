import React, { useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Cpu,
  FileCode,
  HardDrive,
  Layers,
  ShieldCheck,
  Zap,
  Copy,
  Check,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stack' | 'blueprint' | 'snippets'>('stack');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const codeSnippets = {
    imageResizeAndBand: `// Production Utility: Image Resizer & Dedicated Footer Band
export async function resizeImageWithFooterBand(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  captionText: string,
  subtext?: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const footerHeight = 60; // Dedicated footer strip height
  canvas.width = targetWidth;
  canvas.height = targetHeight + footerHeight;

  // 1. Draw scaled main image
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 2. Draw dark footer band strip below photo
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, targetHeight, targetWidth, footerHeight);

  // 3. Render name & text metadata
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(captionText, targetWidth / 2, targetHeight + 28);

  if (subtext) {
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(subtext, targetWidth / 2, targetHeight + 48);
  }

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92)
  );
}`,
    pdfToJpgAndJpgToPdf: `// Production Utility: PDF-to-JPG & JPG-to-PDF Engines
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Convert PDF pages to 300 DPI Images
export async function pdfToJpg(pdfBuffer: ArrayBuffer, dpi = 300) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const images = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: dpi / 72 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL('image/jpeg', 0.95));
  }
  return images;
}

// Convert Images to Single PDF Document
export async function imagesToPdf(files: File[], pageSize = 'A4') {
  const pdfDoc = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const image = file.type === 'image/png' 
      ? await pdfDoc.embedPng(bytes) 
      : await pdfDoc.embedJpg(bytes);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    page.drawImage(image, { x: 20, y: 20, width: 555.28, height: 801.89 });
  }
  return await pdfDoc.save();
}`,
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F7] text-gray-900 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Title Header */}
      <div className="border-b border-gray-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mb-1 font-semibold">
            <Cpu className="w-4 h-4 text-gray-700" />
            <span>PRINCIPAL SOFTWARE ENGINEER ARCHITECT SPECIFICATION</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            OmniStudio Cross-Platform Desktop Architecture
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-[8px] border border-gray-300 text-xs shadow-sm">
          <button
            onClick={() => setActiveTab('stack')}
            className={`px-3 py-1.5 rounded-[8px] font-medium transition ${
              activeTab === 'stack' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Stack Evaluation & Benchmarks
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-1.5 rounded-[8px] font-medium transition ${
              activeTab === 'blueprint' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            System Blueprint & Tree
          </button>
          <button
            onClick={() => setActiveTab('snippets')}
            className={`px-3 py-1.5 rounded-[8px] font-medium transition ${
              activeTab === 'snippets' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Core Utility Code
          </button>
        </div>
      </div>

      {activeTab === 'stack' && (
        <div className="space-y-6">
          {/* Architectural Winner Banner */}
          <div className="bg-white border border-gray-300 p-5 rounded-[8px] space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 bg-gray-900 text-white rounded-[8px] text-xs font-mono font-semibold">
                RECOMMENDED ARCHITECTURAL CHOICE: TAURI + REACT / TYPESCRIPT
              </span>
              <span className="text-xs font-mono text-gray-600 font-semibold">Binary Size: ~12 MB</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              <strong>Architect Decision:</strong> For heavy media manipulation (high-DPI images, PDF page manipulation) requiring cross-platform distribution (Windows, macOS, Linux) with strict zero-cloud privacy constraints, <strong>Tauri + React/TypeScript (Option 1)</strong> yields the optimal ratio of binary footprint, startup speed, and runtime memory efficiency.
            </p>
          </div>

          {/* Comparative Evaluation Table */}
          <div className="bg-white border border-gray-300 rounded-[8px] overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-gray-200 text-xs font-semibold text-gray-900">
              Cross-Platform Desktop Framework Evaluation Matrix
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 font-mono border-b border-gray-200">
                  <tr>
                    <th className="p-3">Framework Stack</th>
                    <th className="p-3">Binary Size</th>
                    <th className="p-3">RAM Footprint</th>
                    <th className="p-3">Rendering Engine</th>
                    <th className="p-3">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  <tr className="bg-gray-50/50">
                    <td className="p-3 font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Option 1: Tauri + React/TS</span>
                    </td>
                    <td className="p-3 font-mono text-emerald-700 font-bold">~12 MB</td>
                    <td className="p-3 font-mono text-emerald-700 font-bold">~45 MB Idle</td>
                    <td className="p-3">OS Webview (WebView2/WebKit)</td>
                    <td className="p-3 text-emerald-700 font-semibold">★ Recommended Winner</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Option 1b: Electron + React</td>
                    <td className="p-3 font-mono text-rose-600">~125 MB</td>
                    <td className="p-3 font-mono text-rose-600">~280 MB Idle</td>
                    <td className="p-3">Bundled Chromium Engine</td>
                    <td className="p-3 text-gray-500">Heavy binary & high RAM overhead</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Option 2: Python + PyQt6 / PIL</td>
                    <td className="p-3 font-mono text-amber-600">~65 MB (PyInstaller)</td>
                    <td className="p-3 font-mono text-amber-600">~90 MB</td>
                    <td className="p-3">Qt6 C++ Native Widgets</td>
                    <td className="p-3 text-gray-500">Great processing, complex UI styling</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Option 3: Flutter Desktop / MAUI</td>
                    <td className="p-3 font-mono text-amber-600">~35 MB</td>
                    <td className="p-3 font-mono text-amber-600">~110 MB</td>
                    <td className="p-3">Impeller / Skia Canvas</td>
                    <td className="p-3 text-gray-500">Slower PDF DOM manipulation ecosystem</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'blueprint' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-300 p-5 rounded-[8px] space-y-3 font-mono text-xs shadow-sm">
            <div className="text-gray-900 font-bold mb-2">📁 Recommended Project Directory Tree</div>
            <pre className="text-gray-700 overflow-x-auto leading-relaxed">
{`omnistudio-desktop/
├── src-tauri/             # Rust Native Wrapper (System tray, Native File System IPC)
│   ├── Cargo.toml
│   └── src/main.rs
├── src/
│   ├── components/        # Modular UX Workspaces
│   │   ├── ImageStudio/   # Resizer, Footer Captioner, Aspect Lock
│   │   ├── PdfEditor/     # Thumbnail reorder, Rotation, Vector Annotations
│   │   └── FileConverter/ # PDF-to-Image (DPI) & Image-to-PDF
│   ├── utils/
│   │   ├── imageEngine.ts # Canvas API, DPI scaling, Footer band generator
│   │   └── pdfEngine.ts   # pdf-lib & pdfjs-dist engines
│   └── types.ts           # Strict TypeScript contracts
└── package.json`}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'snippets' && (
        <div className="space-y-6">
          {Object.entries(codeSnippets).map(([id, snippet]) => (
            <div key={id} className="bg-white border border-gray-300 rounded-[8px] overflow-hidden shadow-sm">
              <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-mono text-gray-900 font-bold">{id}</span>
                <button
                  onClick={() => copyCode(snippet, id)}
                  className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-300 rounded-[8px] text-gray-700 text-[11px] font-mono flex items-center gap-1 shadow-xs"
                >
                  {copiedSnippet === id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet === id ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-800 overflow-x-auto leading-relaxed bg-gray-50">
                {snippet}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
