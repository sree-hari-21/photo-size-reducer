import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Check,
  CheckSquare,
  Copy,
  Download,
  Eye,
  FileDigit,
  FilePlus,
  FileText,
  Highlighter,
  Layers,
  Merge,
  MoveLeft,
  MoveRight,
  PenTool,
  RotateCw,
  Scissors,
  ShieldAlert,
  Square,
  SquareDashed,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import { AnnotationType, PdfAnnotation, PdfPageItem } from '../../types';
import {
  extractPdfPages,
  mergePdfFiles,
  processPdfDocument,
  renderPdfPageToCanvas,
  splitPdfIntoPages,
  createDownloadLink,
} from '../../utils/pdfEngine';

interface PdfEditorProps {
  onStatusChange: (msg: string, details?: string) => void;
  onSetIsProcessing: (processing: boolean) => void;
  initialPdfFile?: File | null;
}

export const PdfEditor: React.FC<PdfEditorProps> = ({
  onStatusChange,
  onSetIsProcessing,
  initialPdfFile,
}) => {
  // Active PDF File State
  const [pdfFile, setPdfFile] = useState<File | null>(initialPdfFile || null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  // Page states
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);

  // Rotations Map: pageIndex -> extra rotation degrees
  const [pageRotations, setPageRotations] = useState<Map<number, number>>(new Map());

  // Annotations List
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<AnnotationType | 'select'>('select');

  // Multi PDF Merge State
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [activeEditorTab, setActiveEditorTab] = useState<'pages' | 'annotate' | 'merge'>('pages');

  // Preview Canvas Ref
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Signature Pad State
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingSig, setIsDrawingSig] = useState(false);

  // Load PDF when file changes
  useEffect(() => {
    if (!pdfFile) return;

    onSetIsProcessing(true);
    pdfFile.arrayBuffer().then((buffer) => {
      setPdfBuffer(buffer);

      // Load PDF JS document to count pages
      import('pdfjs-dist').then((pdfjsLib) => {
        pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise.then((pdf) => {
          setNumPages(pdf.numPages);

          const initialPages: PdfPageItem[] = Array.from({ length: pdf.numPages }, (_, i) => ({
            pageIndex: i,
            rotation: 0,
            selected: false,
          }));

          setPages(initialPages);
          setActivePageIndex(0);
          setPageRotations(new Map());
          setAnnotations([]);
          onSetIsProcessing(false);
          onStatusChange(`Loaded PDF: ${pdfFile.name} (${pdf.numPages} pages)`);
        });
      });
    });
  }, [pdfFile]);

  // Render current active page to canvas
  useEffect(() => {
    if (!pdfBuffer || numPages === 0 || !pageCanvasRef.current) return;

    renderPdfPageToCanvas(pdfBuffer, activePageIndex, pageCanvasRef.current, 1.5).catch((err) =>
      console.error(err)
    );
  }, [pdfBuffer, activePageIndex, pageRotations]);

  // Handle Page Selection Toggle
  const togglePageSelection = (pageIdx: number) => {
    setPages((prev) =>
      prev.map((p) => (p.pageIndex === pageIdx ? { ...p, selected: !p.selected } : p))
    );
  };

  const selectAllPages = (selected: boolean) => {
    setPages((prev) => prev.map((p) => ({ ...p, selected })));
  };

  // Rotate selected pages
  const handleRotateSelectedPages = (delta: number) => {
    const selectedIndices = pages.filter((p) => p.selected).map((p) => p.pageIndex);
    if (selectedIndices.length === 0) {
      selectedIndices.push(activePageIndex);
    }

    const nextRotations = new Map<number, number>(pageRotations);
    selectedIndices.forEach((idx) => {
      const cur = nextRotations.get(idx) || 0;
      nextRotations.set(idx, (cur + delta) % 360);
    });

    setPageRotations(nextRotations);
    onStatusChange(`Rotated ${selectedIndices.length} page(s) by ${delta}°`);
  };

  // Move page position in page array
  const movePage = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;

    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[targetIdx];
    newPages[targetIdx] = temp;
    setPages(newPages);
  };

  // Delete selected pages
  const handleDeleteSelectedPages = () => {
    const selectedIndices = new Set(pages.filter((p) => p.selected).map((p) => p.pageIndex));
    if (selectedIndices.size === 0) return;

    const remainingPages = pages.filter((p) => !selectedIndices.has(p.pageIndex));
    setPages(remainingPages);
    if (remainingPages.length > 0) {
      setActivePageIndex(0);
    }
    onStatusChange(`Deleted ${selectedIndices.size} page(s)`);
  };

  // Extract selected pages into new PDF
  const handleExtractPages = async () => {
    if (!pdfBuffer) return;
    const selectedIndices = pages.filter((p) => p.selected).map((p) => p.pageIndex);
    if (selectedIndices.length === 0) return;

    onSetIsProcessing(true);
    const pdfBytes = await extractPdfPages(pdfBuffer, selectedIndices);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    createDownloadLink(blob, `extracted_${selectedIndices.length}_pages.pdf`);
    onSetIsProcessing(false);
    onStatusChange(`Extracted ${selectedIndices.length} pages to new PDF document!`);
  };

  // Add Annotation on Canvas Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'select' || !pageCanvasRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const yPct = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));

    const newAnno: PdfAnnotation = {
      id: Math.random().toString(36).substring(2, 9),
      pageIndex: activePageIndex,
      type: selectedTool,
      x: xPct,
      y: yPct,
      width: selectedTool === 'redaction' || selectedTool === 'highlight' ? 25 : 20,
      height: selectedTool === 'redaction' || selectedTool === 'highlight' ? 8 : 10,
      text: selectedTool === 'text' ? 'Sample Text' : selectedTool === 'date' ? new Date().toLocaleDateString() : undefined,
      color: selectedTool === 'redaction' ? '#000000' : '#2563eb',
      fillColor: selectedTool === 'highlight' ? '#fef08a' : selectedTool === 'redaction' ? '#000000' : '#3b82f622',
      fontSize: 14,
    };

    setAnnotations((prev) => [...prev, newAnno]);
    onStatusChange(`Added ${selectedTool} annotation to page ${activePageIndex + 1}`);
  };

  // Export Modified PDF
  const handleExportModifiedPdf = async () => {
    if (!pdfBuffer) return;
    onSetIsProcessing(true);
    onStatusChange('Applying page operations and vector annotations to PDF...');

    try {
      const currentOrder = pages.map((p) => p.pageIndex);
      const pdfBytes = await processPdfDocument(
        pdfBuffer,
        pageRotations,
        currentOrder,
        annotations
      );

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      createDownloadLink(blob, `edited_${pdfFile?.name || 'document.pdf'}`);
      onSetIsProcessing(false);
      onStatusChange('Exported edited PDF successfully!');
    } catch (err) {
      console.error(err);
      onSetIsProcessing(false);
      onStatusChange(`Error exporting PDF: ${err}`);
    }
  };

  // Merge Multiple PDFs
  const handleMergePdfFiles = async () => {
    if (mergeFiles.length < 2) return;
    onSetIsProcessing(true);
    onStatusChange(`Merging ${mergeFiles.length} PDF files into one...`);

    try {
      const buffers = await Promise.all(mergeFiles.map((f) => f.arrayBuffer()));
      const mergedBytes = await mergePdfFiles(buffers);
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      createDownloadLink(blob, 'Merged_Master_Document.pdf');
      onSetIsProcessing(false);
      onStatusChange(`Successfully merged ${mergeFiles.length} PDF documents!`);
    } catch (err) {
      console.error(err);
      onSetIsProcessing(false);
      onStatusChange(`Merge error: ${err}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F7] text-gray-900 overflow-hidden">
      {/* Top Workspace Toolbar */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-1 bg-gray-100 p-1 border border-gray-200 text-xs rounded-[8px]">
          <button
            onClick={() => setActiveEditorTab('pages')}
            className={`px-4 py-1.5 font-bold uppercase tracking-widest flex items-center gap-2 transition rounded-[8px] ${
              activeEditorTab === 'pages' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pages ({pages.length})</span>
          </button>
          <button
            onClick={() => setActiveEditorTab('annotate')}
            className={`px-4 py-1.5 font-bold uppercase tracking-widest flex items-center gap-2 transition rounded-[8px] ${
              activeEditorTab === 'annotate' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Annotate & Redact</span>
          </button>
          <button
            onClick={() => setActiveEditorTab('merge')}
            className={`px-4 py-1.5 font-bold uppercase tracking-widest flex items-center gap-2 transition rounded-[8px] ${
              activeEditorTab === 'merge' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Merge className="w-3.5 h-3.5" />
            <span>Merge & Split</span>
          </button>
        </div>

        {/* Load / Download PDF */}
        <div className="flex items-center gap-3">
          <div className="relative border border-gray-300 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 text-xs font-mono uppercase tracking-wider cursor-pointer transition text-gray-900 rounded-[8px]">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) setPdfFile(e.target.files[0]);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <span className="flex items-center gap-2 font-medium">
              <Upload className="w-3.5 h-3.5 text-gray-900" />
              <span>{pdfFile ? 'Change PDF' : 'Upload PDF'}</span>
            </span>
          </div>

          <button
            onClick={handleExportModifiedPdf}
            disabled={!pdfBuffer}
            className="px-4 py-1.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-30 transition cursor-pointer shadow-sm rounded-[8px]"
          >
            <Download className="w-3.5 h-3.5 inline mr-1.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeEditorTab === 'pages' && (
          /* PAGE MANAGEMENT TAB */
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
            {/* Action Bar for Pages */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 border border-gray-300 shadow-sm text-xs font-mono rounded-[8px]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectAllPages(true)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 uppercase tracking-wider font-semibold rounded-[8px]"
                >
                  Select All
                </button>
                <button
                  onClick={() => selectAllPages(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 uppercase tracking-wider font-semibold rounded-[8px]"
                >
                  Clear Selection
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRotateSelectedPages(90)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 flex items-center gap-2 uppercase tracking-wider font-semibold rounded-[8px]"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate 90°</span>
                </button>
                <button
                  onClick={handleExtractPages}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 flex items-center gap-2 uppercase tracking-wider font-semibold rounded-[8px]"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Extract</span>
                </button>
                <button
                  onClick={handleDeleteSelectedPages}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-900 text-white flex items-center gap-2 uppercase tracking-wider font-semibold rounded-[8px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Page Thumbnails Grid */}
            {pages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {pages.map((p, idx) => {
                  const rotation = pageRotations.get(p.pageIndex) || 0;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActivePageIndex(p.pageIndex)}
                      className={`group relative bg-white border p-3 flex flex-col items-center justify-between cursor-pointer transition shadow-sm rounded-[8px] ${
                        p.pageIndex === activePageIndex
                          ? 'border-gray-900 ring-2 ring-gray-900/20 shadow-md'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {/* Checkbox overlay */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePageSelection(p.pageIndex);
                        }}
                        className="absolute top-4 left-4 z-10 w-5 h-5 bg-white border border-gray-400 flex items-center justify-center cursor-pointer shadow-sm rounded-[8px]"
                      >
                        {p.selected && <Check className="w-3.5 h-3.5 text-gray-900 font-bold" />}
                      </div>

                      {/* Rotation indicator */}
                      {rotation !== 0 && (
                        <div className="absolute top-4 right-4 z-10 px-1.5 py-0.5 bg-gray-900 text-white border border-gray-900 text-[9px] font-mono rounded-[8px]">
                          {rotation}°
                        </div>
                      )}

                      <div className="w-full h-44 bg-gray-50 border border-gray-200 flex items-center justify-center p-2 mb-3 overflow-hidden rounded-[8px]">
                        <div
                          style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: 'transform 0.2s ease',
                          }}
                          className="text-gray-500 font-mono text-xs flex flex-col items-center"
                        >
                          <FileText className="w-10 h-10 mb-2 text-gray-400" />
                          <span>PAGE {p.pageIndex + 1}</span>
                        </div>
                      </div>

                      <div className="w-full flex items-center justify-between text-[10px] text-gray-500 font-mono pt-2 border-t border-gray-200 uppercase tracking-widest font-semibold">
                        <span>P. {p.pageIndex + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              movePage(idx, 'left');
                            }}
                            disabled={idx === 0}
                            className="p-1 hover:text-gray-900 disabled:opacity-20 text-gray-500 rounded-[8px]"
                          >
                            <MoveLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              movePage(idx, 'right');
                            }}
                            disabled={idx === pages.length - 1}
                            className="p-1 hover:text-gray-900 disabled:opacity-20 text-gray-500 rounded-[8px]"
                          >
                            <MoveRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-24 text-gray-400 text-xs border border-gray-300 bg-white shadow-sm rounded-[8px]">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-serif italic text-lg text-gray-900 mb-1">No Document Selected</p>
                <p>Upload a PDF file or click "Sample PDF" in top title bar to view pages.</p>
              </div>
            )}
          </div>
        )}

        {activeEditorTab === 'annotate' && (
          /* ANNOTATION & REDACTION TAB */
          <div className="flex-1 flex overflow-hidden">
            {/* Annotation Tools Bar */}
            <div className="w-64 bg-white border-r border-gray-300 p-6 space-y-6 overflow-y-auto shrink-0 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                Tools
              </p>

              <div className="space-y-2">
                {[
                  { id: 'select', label: 'Select / View', icon: Eye },
                  { id: 'text', label: 'Add Text', icon: Type },
                  { id: 'date', label: 'Date Stamp', icon: Calendar },
                  { id: 'highlight', label: 'Highlight', icon: Highlighter },
                  { id: 'redaction', label: 'Redact Block', icon: ShieldAlert },
                  { id: 'rectangle', label: 'Rectangle', icon: Square },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTool(t.id as any)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition rounded-[8px] ${
                        selectedTool === t.id
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Annotations on current page */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                  Page Annotations ({annotations.filter((a) => a.pageIndex === activePageIndex).length})
                </p>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {annotations
                    .filter((a) => a.pageIndex === activePageIndex)
                    .map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 text-xs rounded-[8px]"
                      >
                        <span className="uppercase font-mono text-gray-900 text-[10px] font-medium">{a.type}</span>
                        <button
                          onClick={() => setAnnotations((prev) => prev.filter((item) => item.id !== a.id))}
                          className="text-gray-400 hover:text-gray-900"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Interactive Canvas Viewport */}
            <div className="flex-1 bg-[#F5F5F7] p-8 flex items-center justify-center relative overflow-auto">
              <div
                onClick={handleCanvasClick}
                className="relative bg-white shadow-xl p-1 border border-gray-300 cursor-crosshair rounded-[8px]"
              >
                <canvas ref={pageCanvasRef} className="block max-h-[75vh] rounded-[8px]" />

                {/* Render overlay annotation boxes */}
                {annotations
                  .filter((a) => a.pageIndex === activePageIndex)
                  .map((a) => (
                    <div
                      key={a.id}
                      style={{
                        position: 'absolute',
                        left: `${a.x}%`,
                        top: `${a.y}%`,
                        width: `${a.width}%`,
                        height: `${a.height}%`,
                        backgroundColor: a.fillColor || 'transparent',
                        borderColor: a.color || '#000000',
                        borderWidth: a.type === 'redaction' ? 0 : '1px',
                        color: a.color || '#000000',
                      }}
                      className="flex items-center justify-center text-xs font-mono p-1 pointer-events-none rounded-[8px]"
                    >
                      {a.text}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeEditorTab === 'merge' && (
          /* MERGE & SPLIT TAB */
          <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-6 overflow-y-auto">
            <div className="bg-white border border-gray-300 shadow-sm p-8 space-y-6 rounded-[8px]">
              <h3 className="text-xl font-serif italic text-gray-900 flex items-center gap-3 border-b border-gray-200 pb-4">
                <Merge className="w-5 h-5 text-gray-900" />
                <span>Combine & Merge PDF Documents</span>
              </h3>

              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                  Select Source PDF Files
                </p>
                <div className="relative border border-dashed border-gray-300 hover:border-gray-800 p-6 bg-gray-50 text-center cursor-pointer rounded-[8px]">
                  <input
                    type="file"
                    multiple
                    accept="application/pdf"
                    onChange={(e) => {
                      if (e.target.files) {
                        setMergeFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FilePlus className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-900 block">Add Documents</span>
                </div>
              </div>

              {/* Merge Queue List */}
              {mergeFiles.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                    Document Sequence ({mergeFiles.length} Files)
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {mergeFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 text-xs rounded-[8px]"
                      >
                        <span className="font-mono text-gray-900 truncate font-medium">{f.name}</span>
                        <button
                          onClick={() => setMergeFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-gray-400 hover:text-gray-900"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleMergePdfFiles}
                    className="w-full py-3 bg-gray-900 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-800 transition cursor-pointer shadow-sm mt-4 rounded-[8px]"
                  >
                    Merge All Documents
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
