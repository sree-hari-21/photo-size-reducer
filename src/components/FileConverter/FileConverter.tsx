import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileCode,
  FileImage,
  FileText,
  FolderArchive,
  Image as ImageIcon,
  Layers,
  MoveDown,
  MoveUp,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { ImageToPdfSettings, PdfPageOrientation, PdfPageSize, PdfToImageSettings } from '../../types';
import { convertImagesToPdf, convertPdfToImages, createDownloadLink } from '../../utils/pdfEngine';

interface FileConverterProps {
  onStatusChange: (msg: string, details?: string) => void;
  onSetIsProcessing: (processing: boolean) => void;
  initialPdfFile?: File | null;
}

export const FileConverter: React.FC<FileConverterProps> = ({
  onStatusChange,
  onSetIsProcessing,
  initialPdfFile,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pdfToImg' | 'imgToPdf'>('pdfToImg');

  // PDF to Image State
  const [pdfFile, setPdfFile] = useState<File | null>(initialPdfFile || null);
  const [pdfToImgSettings, setPdfToImgSettings] = useState<PdfToImageSettings>({
    dpi: 300,
    format: 'jpeg',
    pageRange: 'all',
  });
  const [convertedImages, setConvertedImages] = useState<
    { pageIndex: number; dataUrl: string; blob: Blob }[]
  >([]);

  // Image to PDF State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imgToPdfSettings, setImgToPdfSettings] = useState<ImageToPdfSettings>({
    pageSize: 'A4',
    orientation: 'portrait',
    marginMm: 10,
    quality: 0.95,
    title: 'Combined_Document.pdf',
  });

  // Handle PDF to Image Conversion
  const handleConvertPdfToImages = async () => {
    if (!pdfFile) return;
    onSetIsProcessing(true);
    onStatusChange(`Rendering PDF pages to ${pdfToImgSettings.dpi} DPI images...`);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const results = await convertPdfToImages(arrayBuffer, pdfToImgSettings);
      setConvertedImages(results);
      onSetIsProcessing(false);
      onStatusChange(`Converted ${results.length} PDF pages to ${pdfToImgSettings.format.toUpperCase()} images!`);
    } catch (err) {
      console.error(err);
      onSetIsProcessing(false);
      onStatusChange(`Error converting PDF pages: ${err}`);
    }
  };

  // Handle Image to PDF Conversion
  const handleConvertImagesToPdf = async () => {
    if (imageFiles.length === 0) return;
    onSetIsProcessing(true);
    onStatusChange(`Combining ${imageFiles.length} images into PDF (${imgToPdfSettings.pageSize})...`);

    try {
      const pdfBytes = await convertImagesToPdf(imageFiles, imgToPdfSettings);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      createDownloadLink(blob, imgToPdfSettings.title || 'Combined_Document.pdf');
      onSetIsProcessing(false);
      onStatusChange(`PDF Document generated and downloaded successfully!`);
    } catch (err) {
      console.error(err);
      onSetIsProcessing(false);
      onStatusChange(`Error combining images to PDF: ${err}`);
    }
  };

  // Reorder Images in list
  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...imageFiles];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newFiles.length) return;

    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIdx];
    newFiles[targetIdx] = temp;
    setImageFiles(newFiles);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F7] text-gray-900 overflow-hidden">
      {/* Top Selector Subtabs */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-center gap-2 shadow-sm">
        <button
          onClick={() => setActiveSubTab('pdfToImg')}
          className={`flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-widest transition rounded-[8px] ${
            activeSubTab === 'pdfToImg'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>PDF to Image</span>
          <ArrowRight className="w-3 h-3 opacity-40" />
          <ImageIcon className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setActiveSubTab('imgToPdf')}
          className={`flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-widest transition rounded-[8px] ${
            activeSubTab === 'imgToPdf'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Image to PDF</span>
          <ArrowRight className="w-3 h-3 opacity-40" />
          <FileText className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full space-y-6">
        {activeSubTab === 'pdfToImg' ? (
          /* PDF TO IMAGE PANEL */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Options Controls */}
            <div className="bg-white border border-gray-300 shadow-sm p-6 space-y-6 rounded-[8px]">
              <h3 className="text-xl font-serif italic text-gray-900 border-b border-gray-200 pb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-900" />
                <span>PDF to Image Options</span>
              </h3>

              {/* Upload PDF */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                  Source Document
                </p>
                <div className="relative border border-dashed border-gray-300 hover:border-gray-800 p-6 bg-gray-50 text-center cursor-pointer rounded-[8px]">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setPdfFile(e.target.files[0]);
                        setConvertedImages([]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                  <span className="text-xs font-mono text-gray-900 block truncate font-medium">
                    {pdfFile ? pdfFile.name : 'Drop PDF or Click to Select'}
                  </span>
                </div>
              </div>

              {/* DPI & Quality */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                    Resolution (DPI)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[72, 150, 300].map((d) => (
                      <button
                        key={d}
                        onClick={() =>
                          setPdfToImgSettings((s) => ({ ...s, dpi: d as 72 | 150 | 300 }))
                        }
                        className={`py-2 text-xs font-mono transition border rounded-[8px] ${
                          pdfToImgSettings.dpi === d
                            ? 'bg-gray-900 text-white font-bold border-gray-900'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {d} DPI
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                    Output Format
                  </p>
                  <select
                    value={pdfToImgSettings.format}
                    onChange={(e) =>
                      setPdfToImgSettings((s) => ({ ...s, format: e.target.value as 'png' | 'jpeg' }))
                    }
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-900 font-mono outline-none focus:border-gray-900 rounded-[8px]"
                  >
                    <option value="jpeg">JPEG (.jpg)</option>
                    <option value="png">PNG (.png High Fidelity)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                    Page Selection
                  </p>
                  <input
                    type="text"
                    value={pdfToImgSettings.pageRange}
                    onChange={(e) =>
                      setPdfToImgSettings((s) => ({ ...s, pageRange: e.target.value }))
                    }
                    placeholder="e.g. all OR 1, 3, 5-7"
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-900 font-mono outline-none focus:border-gray-900 rounded-[8px]"
                  />
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono block">
                    Use "all" or explicit page numbers
                  </span>
                </div>
              </div>

              <button
                onClick={handleConvertPdfToImages}
                disabled={!pdfFile}
                className="w-full py-3 bg-gray-900 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-30 transition cursor-pointer shadow-sm rounded-[8px]"
              >
                Convert to Images
              </button>
            </div>

            {/* Right Converted Images Gallery */}
            <div className="lg:col-span-2 bg-white border border-gray-300 shadow-sm p-6 space-y-6 rounded-[8px]">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <h3 className="text-xl font-serif italic text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-gray-900" />
                  <span>Rendered Pages ({convertedImages.length})</span>
                </h3>

                {convertedImages.length > 0 && (
                  <span className="text-[10px] font-mono text-gray-700 bg-gray-100 border border-gray-300 px-2 py-0.5 uppercase tracking-wider font-semibold rounded-[8px]">
                    {pdfToImgSettings.dpi} DPI Ready
                  </span>
                )}
              </div>

              {convertedImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {convertedImages.map((img) => (
                    <div
                      key={img.pageIndex}
                      className="group bg-gray-50 border border-gray-200 p-3 flex flex-col items-center justify-between space-y-3 hover:border-gray-900 transition rounded-[8px]"
                    >
                      <img
                        src={img.dataUrl}
                        alt={`Page ${img.pageIndex + 1}`}
                        className="w-full h-36 object-contain bg-white shadow-sm border border-gray-200 rounded-[8px]"
                      />
                      <div className="w-full flex items-center justify-between text-[10px] text-gray-600 font-mono uppercase tracking-widest pt-2 border-t border-gray-200">
                        <span>Page {img.pageIndex + 1}</span>
                        <a
                          href={img.dataUrl}
                          download={`page_${img.pageIndex + 1}.${pdfToImgSettings.format}`}
                          className="p-1.5 bg-gray-900 text-white hover:bg-gray-800 transition rounded-[8px]"
                          title="Download Image"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 text-gray-400 text-xs border border-gray-200 bg-gray-50 rounded-[8px]">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-serif italic text-lg text-gray-800 mb-1">No Rendered Images</p>
                  <p>Upload a PDF file and click "Convert to Images".</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* IMAGE TO PDF PANEL */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Settings */}
            <div className="bg-white border border-gray-300 shadow-sm p-6 space-y-6 rounded-[8px]">
              <h3 className="text-xl font-serif italic text-gray-900 border-b border-gray-200 pb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-gray-900" />
                <span>Image to PDF Settings</span>
              </h3>

              {/* Upload Images */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                  Source Images
                </p>
                <div className="relative border border-dashed border-gray-300 hover:border-gray-800 p-6 bg-gray-50 text-center cursor-pointer rounded-[8px]">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      if (e.target.files) {
                        setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Plus className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-900 block">Add Images</span>
                </div>
              </div>

              {/* Page Layout Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">Page Size</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['A4', 'Letter', 'Fit'] as PdfPageSize[]).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setImgToPdfSettings((s) => ({ ...s, pageSize: sz }))}
                        className={`py-2 text-xs font-mono transition border rounded-[8px] ${
                          imgToPdfSettings.pageSize === sz
                            ? 'bg-gray-900 text-white font-bold border-gray-900'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">Orientation</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['portrait', 'landscape'] as PdfPageOrientation[]).map((o) => (
                      <button
                        key={o}
                        onClick={() => setImgToPdfSettings((s) => ({ ...s, orientation: o }))}
                        className={`py-2 text-xs font-mono uppercase tracking-wider transition border rounded-[8px] ${
                          imgToPdfSettings.orientation === o
                            ? 'bg-gray-900 text-white font-bold border-gray-900'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                    <span>Page Margin</span>
                    <span className="font-mono text-gray-900 font-bold">{imgToPdfSettings.marginMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={imgToPdfSettings.marginMm}
                    onChange={(e) =>
                      setImgToPdfSettings((s) => ({ ...s, marginMm: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full accent-gray-900 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">Document Title</p>
                  <input
                    type="text"
                    value={imgToPdfSettings.title}
                    onChange={(e) => setImgToPdfSettings((s) => ({ ...s, title: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-900 font-mono outline-none focus:border-gray-900 rounded-[8px]"
                  />
                </div>
              </div>

              <button
                onClick={handleConvertImagesToPdf}
                disabled={imageFiles.length === 0}
                className="w-full py-3 bg-gray-900 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-30 transition cursor-pointer shadow-sm rounded-[8px]"
              >
                Generate PDF
              </button>
            </div>

            {/* Right Images Queue List */}
            <div className="lg:col-span-2 bg-white border border-gray-300 shadow-sm p-6 space-y-6 rounded-[8px]">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <h3 className="text-xl font-serif italic text-gray-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gray-900" />
                  <span>Images Queue ({imageFiles.length})</span>
                </h3>

                {imageFiles.length > 0 && (
                  <button
                    onClick={() => setImageFiles([])}
                    className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900"
                  >
                    Clear Queue
                  </button>
                )}
              </div>

              {imageFiles.length > 0 ? (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {imageFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 text-xs rounded-[8px]"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className="w-6 h-6 bg-gray-900 text-white flex items-center justify-center font-mono font-bold text-[10px] shrink-0 rounded-[8px]">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <div className="text-gray-900 font-medium truncate">{file.name}</div>
                          <div className="text-[9px] text-gray-500 font-mono">
                            {(file.size / 1024).toFixed(1)} KB • {file.type}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveImage(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 rounded-[8px]"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveImage(idx, 'down')}
                          disabled={idx === imageFiles.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 rounded-[8px]"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setImageFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-gray-400 hover:text-gray-900 ml-2 rounded-[8px]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 text-gray-400 text-xs border border-gray-200 bg-gray-50 rounded-[8px]">
                  <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-serif italic text-lg text-gray-800 mb-1">Queue Empty</p>
                  <p>Add image files to combine them into a single PDF document.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
