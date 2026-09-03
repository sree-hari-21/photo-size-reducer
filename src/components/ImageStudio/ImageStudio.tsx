import React, { useState, useEffect, useRef } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  Download,
  FileImage,
  Image as ImageIcon,
  Layers,
  Lock,
  LockOpen,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Sliders,
  Sparkles,
  Type,
  Upload,
  Trash2,
} from 'lucide-react';
import {
  BatchImageItem,
  CaptionConfig,
  DimensionUnit,
  ImageExportFormat,
  ImageResizeConfig,
} from '../../types';
import {
  IMAGE_PRESETS,
  canvasToBlob,
  convertFromPixels,
  convertToPixels,
  createDownloadLink,
  processImageToCanvas,
} from '../../utils/imageEngine';

interface ImageStudioProps {
  onStatusChange: (msg: string, details?: string) => void;
  onSetIsProcessing: (processing: boolean) => void;
  initialFile?: File | null;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({
  onStatusChange,
  onSetIsProcessing,
  initialFile,
}) => {
  // Active selected image element
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('photo.jpg');

  // Dimension & Preset Configuration State
  const [unit, setUnit] = useState<DimensionUnit>('px');
  const [dpi, setDpi] = useState<number>(300);
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1080);
  const [originalWidth, setOriginalWidth] = useState<number>(1080);
  const [originalHeight, setOriginalHeight] = useState<number>(1080);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');

  // Export Settings
  const [quality, setQuality] = useState<number>(0.92);
  const [format, setFormat] = useState<ImageExportFormat>('image/jpeg');

  // Caption & Footer Band State
  const [caption, setCaption] = useState<CaptionConfig>({
    text: '',
    subtext: '',
    mode: 'footer_band',
    position: 'bottom',
    fontFamily: 'sans-serif',
    fontSize: 28,
    textColor: '#ffffff',
    backgroundColor: '#0f172a',
    backgroundOpacity: 1.0,
    alignment: 'center',
    padding: 16,
    bold: true,
    italic: false,
  });

  // Batch Processing State
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [batchItems, setBatchItems] = useState<BatchImageItem[]>([]);

  // Preview Canvas Ref
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<string>('Evaluating...');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Handle Initial File passed from App
  useEffect(() => {
    if (initialFile) {
      loadImageFromFile(initialFile);
    }
  }, [initialFile]);

  // Load image from File
  const loadImageFromFile = (file: File) => {
    setOriginalFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSelectedImage(img);
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setWidth(img.width);
        setHeight(img.height);
        setUnit('px');
        setSelectedPresetId('custom');
        onStatusChange(`Loaded image: ${file.name} (${img.width}x${img.height}px)`);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Re-process Canvas on config change
  useEffect(() => {
    if (!selectedImage) return;

    let isMounted = true;
    onSetIsProcessing(true);

    const config: ImageResizeConfig = {
      width,
      height,
      unit,
      dpi,
      maintainAspectRatio,
      originalWidth,
      originalHeight,
      quality,
      format,
      caption,
    };

    processImageToCanvas(selectedImage, config)
      .then((processedCanvas) => {
        if (!isMounted) return;

        const targetCanvas = previewCanvasRef.current;
        if (targetCanvas) {
          targetCanvas.width = processedCanvas.width;
          targetCanvas.height = processedCanvas.height;
          const ctx = targetCanvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
            ctx.drawImage(processedCanvas, 0, 0);
          }
        }

        // Estimate file size
        canvasToBlob(processedCanvas, format, quality).then((blob) => {
          if (!isMounted) return;
          const kb = (blob.size / 1024).toFixed(1);
          setEstimatedSize(`${kb} KB`);
          onSetIsProcessing(false);
          
          const pxW = convertToPixels(width, unit, dpi);
          const pxH = convertToPixels(height, unit, dpi);
          onStatusChange(
            `Resized to ${pxW}x${pxH} px (${unit === 'px' ? '' : `${width}x${height} ${unit} @ `}${dpi} DPI)`,
            `Estimated size: ${kb} KB`
          );
        });
      })
      .catch((err) => {
        console.error(err);
        onSetIsProcessing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    selectedImage,
    width,
    height,
    unit,
    dpi,
    quality,
    format,
    caption,
    maintainAspectRatio,
  ]);

  // Dimension Input Handlers
  const handleWidthChange = (newVal: number) => {
    setWidth(newVal);
    setSelectedPresetId('custom');
    if (maintainAspectRatio && originalWidth > 0) {
      const ratio = originalHeight / originalWidth;
      setHeight(Number((newVal * ratio).toFixed(2)));
    }
  };

  const handleHeightChange = (newVal: number) => {
    setHeight(newVal);
    setSelectedPresetId('custom');
    if (maintainAspectRatio && originalHeight > 0) {
      const ratio = originalWidth / originalHeight;
      setWidth(Number((newVal * ratio).toFixed(2)));
    }
  };

  // Unit Change Handler (converts active dimensions seamlessly)
  const handleUnitChange = (newUnit: DimensionUnit) => {
    if (!selectedImage) {
      setUnit(newUnit);
      return;
    }
    const currentPxW = convertToPixels(width, unit, dpi);
    const currentPxH = convertToPixels(height, unit, dpi);

    const convertedW = convertFromPixels(currentPxW, newUnit, dpi);
    const convertedH = convertFromPixels(currentPxH, newUnit, dpi);

    setUnit(newUnit);
    setWidth(convertedW);
    setHeight(convertedH);
  };

  // Preset Selection Handler
  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') return;

    const preset = IMAGE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setUnit(preset.unit);
    if (preset.dpi) setDpi(preset.dpi);
    setWidth(preset.width);
    setHeight(preset.height);
    setMaintainAspectRatio(false);

    // Default caption style for Passport / ID presets
    if (preset.category === 'id') {
      setCaption((prev) => ({
        ...prev,
        mode: 'footer_band',
        text: prev.text || 'JOHN DOE • ID #84920',
        subtext: prev.subtext || 'ISSUED: 2026 • OFFICIAL DOCUMENT',
        fontSize: Math.round(preset.width * 8),
      }));
    }
  };

  // Single Image Export Download
  const handleExportSingle = async () => {
    if (!selectedImage || !previewCanvasRef.current) return;
    onSetIsProcessing(true);

    const config: ImageResizeConfig = {
      width,
      height,
      unit,
      dpi,
      maintainAspectRatio,
      originalWidth,
      originalHeight,
      quality,
      format,
      caption,
    };

    const finalCanvas = await processImageToCanvas(selectedImage, config);
    const blob = await canvasToBlob(finalCanvas, format, quality);

    const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    const finalName = `${baseName}_resized_${width}x${height}${unit}.${ext}`;

    createDownloadLink(blob, finalName);
    onSetIsProcessing(false);
    onStatusChange(`Exported ${finalName} successfully!`);
  };

  // Batch Image File Add
  const handleBatchFileAdd = (files: FileList | null) => {
    if (!files) return;
    const newItems: BatchImageItem[] = [];

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setBatchItems((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            file,
            previewUrl: url,
            originalWidth: img.width,
            originalHeight: img.height,
            status: 'idle',
          },
        ]);
      };
      img.src = url;
    });
  };

  // Batch Process All Items
  const handleBatchProcessAll = async () => {
    if (batchItems.length === 0) return;
    onSetIsProcessing(true);

    const updated = [...batchItems];
    for (let i = 0; i < updated.length; i++) {
      updated[i].status = 'processing';
      setBatchItems([...updated]);

      const item = updated[i];
      const img = new Image();
      img.src = item.previewUrl;
      await new Promise((res) => (img.onload = res));

      const config: ImageResizeConfig = {
        width,
        height,
        unit,
        dpi,
        maintainAspectRatio,
        originalWidth: item.originalWidth,
        originalHeight: item.originalHeight,
        quality,
        format,
        caption,
      };

      const canvas = await processImageToCanvas(img, config);
      const blob = await canvasToBlob(canvas, format, quality);
      const processedUrl = URL.createObjectURL(blob);

      updated[i].processedBlob = blob;
      updated[i].processedUrl = processedUrl;
      updated[i].status = 'done';
      setBatchItems([...updated]);
    }

    onSetIsProcessing(false);
    onStatusChange(`Processed ${batchItems.length} images in batch!`);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#F5F5F7] text-gray-900">
      {/* Left Settings Controls Sidebar */}
      <div className="w-full lg:w-[420px] border-r border-gray-200 bg-white p-6 overflow-y-auto space-y-8 shrink-0">
        {/* Top Header Mode Toggle */}
        <div className="flex items-center justify-between bg-gray-100 p-1 border border-gray-200 rounded-[8px]">
          <button
            onClick={() => setBatchMode(false)}
            className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition rounded-[8px] ${
              !batchMode
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Single Photo</span>
          </button>
          <button
            onClick={() => setBatchMode(true)}
            className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition rounded-[8px] ${
              batchMode
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch ({batchItems.length})</span>
          </button>
        </div>

        {!batchMode ? (
          <>
            {/* Image File Selector */}
            <section className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                Source Photo
              </p>

              <div className="relative border border-dashed border-gray-300 hover:border-gray-800 p-4 bg-gray-50 hover:bg-gray-100 transition text-center cursor-pointer rounded-[8px]">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/tiff"
                  onChange={(e) => {
                    if (e.target.files?.[0]) loadImageFromFile(e.target.files[0]);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-gray-800 font-medium">
                  <Upload className="w-4 h-4 text-gray-700" />
                  <span>
                    {selectedImage ? originalFileName : 'Drop Image or Click to Select'}
                  </span>
                </div>
              </div>
            </section>

            {/* Presets Selector */}
            <section className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                Standard Presets
              </p>
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-gray-900 outline-none font-mono font-medium rounded-[8px]"
              >
                <option value="custom">Custom Dimensions</option>
                <optgroup label="Official ID & Passport">
                  {IMAGE_PRESETS.filter((p) => p.category === 'id').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.description})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Social Media Banners">
                  {IMAGE_PRESETS.filter((p) => p.category === 'social').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.description})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Standard Photo Print">
                  {IMAGE_PRESETS.filter((p) => p.category === 'print').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.description})
                    </option>
                  ))}
                </optgroup>
              </select>
            </section>

            {/* Dimensions & Units Controls */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                  Dimensions
                </p>
                <button
                  onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                  className={`flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono border rounded-[8px] ${
                    maintainAspectRatio
                      ? 'bg-gray-900 text-white font-bold border-gray-900'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  {maintainAspectRatio ? (
                    <>
                      <Lock className="w-3 h-3" /> Locked
                    </>
                  ) : (
                    <>
                      <LockOpen className="w-3 h-3" /> Free
                    </>
                  )}
                </button>
              </div>

              {/* Units Selection Buttons */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 border border-gray-200 rounded-[8px]">
                {(['px', 'in', 'cm', 'mm'] as DimensionUnit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => handleUnitChange(u)}
                    className={`flex-1 py-1 text-[11px] font-mono transition rounded-[8px] ${
                      unit === u
                        ? 'bg-gray-900 text-white font-bold'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Width & Height Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-gray-400 font-mono block">
                    Width ({unit})
                  </label>
                  <input
                    type="number"
                    step={unit === 'px' ? 1 : 0.01}
                    min={1}
                    value={width}
                    onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-mono focus:border-gray-900 outline-none text-gray-900 rounded-[8px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-gray-400 font-mono block">
                    Height ({unit})
                  </label>
                  <input
                    type="number"
                    step={unit === 'px' ? 1 : 0.01}
                    min={1}
                    value={height}
                    onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-mono focus:border-gray-900 outline-none text-gray-900 rounded-[8px]"
                  />
                </div>
              </div>

              {/* DPI & Output Quality Slider */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-gray-400 font-mono block">
                    DPI Resolution
                  </label>
                  <select
                    value={dpi}
                    onChange={(e) => setDpi(parseInt(e.target.value, 10))}
                    className="w-full bg-gray-50 border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:border-gray-900 outline-none font-mono rounded-[8px]"
                  >
                    <option value={72}>72 DPI (Web)</option>
                    <option value={96}>96 DPI (Screen)</option>
                    <option value={150}>150 DPI (Draft)</option>
                    <option value={300}>300 DPI (Print)</option>
                    <option value={600}>600 DPI (Fine)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-gray-400 font-mono block">
                    Export Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as ImageExportFormat)}
                    className="w-full bg-gray-50 border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:border-gray-900 outline-none font-mono rounded-[8px]"
                  >
                    <option value="image/jpeg">JPEG (.jpg)</option>
                    <option value="image/png">PNG (.png)</option>
                    <option value="image/webp">WEBP (.webp)</option>
                  </select>
                </div>
              </div>

              {/* Quality Compression Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] uppercase text-gray-400 font-mono">
                  <span>Compression</span>
                  <span className="text-gray-900 font-bold">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-gray-900 cursor-pointer"
                />
              </div>
            </section>

            {/* Typography / Overlay / Footer Controls */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                  Overlay & Typography
                </p>
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 border border-gray-200 text-[9px] uppercase font-mono rounded-[8px]">
                  <button
                    onClick={() => setCaption((c) => ({ ...c, mode: 'footer_band' }))}
                    className={`px-2 py-0.5 transition rounded-[8px] ${
                      caption.mode === 'footer_band'
                        ? 'bg-gray-900 text-white font-bold'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Footer
                  </button>
                  <button
                    onClick={() => setCaption((c) => ({ ...c, mode: 'direct_overlay' }))}
                    className={`px-2 py-0.5 transition rounded-[8px] ${
                      caption.mode === 'direct_overlay'
                        ? 'bg-gray-900 text-white font-bold'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Overlay
                  </button>
                </div>
              </div>

              {/* Main & Subtext Inputs */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-gray-400 font-mono block">
                    Main Caption Content
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FATHIMA A MUHAMMADALI"
                    value={caption.text}
                    onChange={(e) => setCaption((c) => ({ ...c, text: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-gray-900 outline-none font-sans rounded-[8px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-gray-400 font-mono block">
                    Secondary Subtext / Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OFFICIAL ID • ISSUED 2026"
                    value={caption.subtext || ''}
                    onChange={(e) => setCaption((c) => ({ ...c, subtext: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-gray-900 outline-none font-sans rounded-[8px]"
                  />
                </div>
              </div>

              {/* Position & Style Controls */}
              {caption.mode === 'direct_overlay' && (
                <div className="space-y-3 pt-1 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-gray-400 font-mono block">Overlay Width</label>
                      <div className="flex bg-gray-100 p-0.5 border border-gray-200 text-[9px] font-mono uppercase rounded-[8px]">
                        <button
                          onClick={() => setCaption((c) => ({ ...c, overlayStyle: 'full_width' }))}
                          className={`flex-1 py-1 text-center transition rounded-[8px] ${
                            (caption.overlayStyle || 'full_width') === 'full_width'
                              ? 'bg-gray-900 text-white font-bold'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Full Width
                        </button>
                        <button
                          onClick={() => setCaption((c) => ({ ...c, overlayStyle: 'fitted_box' }))}
                          className={`flex-1 py-1 text-center transition rounded-[8px] ${
                            caption.overlayStyle === 'fitted_box'
                              ? 'bg-gray-900 text-white font-bold'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Fitted Box
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-gray-400 font-mono block">Position</label>
                      <select
                        value={caption.position || 'bottom'}
                        onChange={(e) => setCaption((c) => ({ ...c, position: e.target.value as any }))}
                        className="w-full bg-gray-50 border border-gray-200 px-2 py-1.5 text-xs text-gray-900 outline-none font-mono rounded-[8px]"
                      >
                        <option value="bottom">Bottom Edge</option>
                        <option value="center">Center</option>
                        <option value="top">Top Edge</option>
                      </select>
                    </div>
                  </div>

                  {/* Vertical Position Y-Offset Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] uppercase text-gray-400 font-mono">
                      <span>Bottom / Edge Offset</span>
                      <span className="text-gray-900 font-bold">{caption.yOffset || 0} px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={120}
                      step={1}
                      value={caption.yOffset || 0}
                      onChange={(e) => setCaption((c) => ({ ...c, yOffset: parseInt(e.target.value) || 0 }))}
                      className="w-full accent-gray-900 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Custom Color & Opacity Controls */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-mono font-semibold">
                  Custom Color & Opacity
                </p>

                {/* Background Color Picker & Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] uppercase text-gray-500 font-mono">
                    <span>Background Color</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={caption.backgroundColor || '#000000'}
                        onChange={(e) => setCaption((c) => ({ ...c, backgroundColor: e.target.value }))}
                        className="w-5 h-5 rounded-[8px] cursor-pointer border-0 bg-transparent"
                      />
                      <span className="font-mono text-[10px] text-gray-800 font-medium">{caption.backgroundColor}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[
                      { name: 'Black', color: '#000000' },
                      { name: 'Navy', color: '#0f172a' },
                      { name: 'Blue', color: '#1e3a8a' },
                      { name: 'Red', color: '#7f1d1d' },
                      { name: 'Dark Gray', color: '#111827' },
                      { name: 'White', color: '#ffffff' },
                    ].map((swatch) => (
                      <button
                        key={swatch.color}
                        onClick={() => setCaption((c) => ({ ...c, backgroundColor: swatch.color }))}
                        className={`flex-1 h-6 border transition rounded-[8px] ${
                          caption.backgroundColor === swatch.color ? 'border-gray-900 scale-105' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: swatch.color }}
                        title={swatch.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Text Color Picker & Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] uppercase text-gray-500 font-mono">
                    <span>Text Color</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={caption.textColor || '#ffffff'}
                        onChange={(e) => setCaption((c) => ({ ...c, textColor: e.target.value }))}
                        className="w-5 h-5 rounded-[8px] cursor-pointer border-0 bg-transparent"
                      />
                      <span className="font-mono text-[10px] text-gray-800 font-medium">{caption.textColor}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[
                      { name: 'White', color: '#ffffff' },
                      { name: 'Yellow', color: '#facc15' },
                      { name: 'Amber', color: '#f59e0b' },
                      { name: 'Black', color: '#000000' },
                      { name: 'Cyan', color: '#06b6d4' },
                    ].map((swatch) => (
                      <button
                        key={swatch.color}
                        onClick={() => setCaption((c) => ({ ...c, textColor: swatch.color }))}
                        className={`flex-1 h-6 border transition rounded-[8px] ${
                          caption.textColor === swatch.color ? 'border-gray-900 scale-105' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: swatch.color }}
                        title={swatch.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Opacity Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] uppercase text-gray-400 font-mono">
                    <span>Background Opacity</span>
                    <span className="text-gray-900 font-bold">{Math.round((caption.backgroundOpacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={caption.backgroundOpacity ?? 1}
                    onChange={(e) => setCaption((c) => ({ ...c, backgroundOpacity: parseFloat(e.target.value) }))}
                    className="w-full accent-gray-900 cursor-pointer"
                  />
                </div>
              </div>

              {/* Font Family, Size & Alignment */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase opacity-40 font-mono block">Font Style</label>
                    <select
                      value={caption.fontFamily}
                      onChange={(e) => setCaption((c) => ({ ...c, fontFamily: e.target.value }))}
                      className="w-full bg-[#1A1A1A] border border-white/10 px-2 py-1.5 text-xs text-white outline-none rounded-[8px]"
                    >
                      <option value="sans-serif">Sans-Serif</option>
                      <option value="serif">Serif (Editorial)</option>
                      <option value="monospace">Monospace (ID Code)</option>
                      <option value="cursive">Handwriting</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-gray-400 font-mono block">Font Size (px)</label>
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={caption.fontSize}
                      onChange={(e) => setCaption((c) => ({ ...c, fontSize: parseInt(e.target.value) || 20 }))}
                      className="w-full bg-gray-50 border border-gray-200 px-2 py-1 text-xs text-gray-900 font-mono outline-none rounded-[8px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {/* Text Alignment */}
                  <div className="flex items-center gap-1 bg-gray-100 p-1 border border-gray-200 rounded-[8px]">
                    <button
                      onClick={() => setCaption((c) => ({ ...c, alignment: 'left' }))}
                      className={`p-1 transition rounded-[8px] ${caption.alignment === 'left' ? 'bg-gray-900 text-white font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                      title="Align Left"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCaption((c) => ({ ...c, alignment: 'center' }))}
                      className={`p-1 transition rounded-[8px] ${caption.alignment === 'center' ? 'bg-gray-900 text-white font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                      title="Align Center"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCaption((c) => ({ ...c, alignment: 'right' }))}
                      className={`p-1 transition rounded-[8px] ${caption.alignment === 'right' ? 'bg-gray-900 text-white font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                      title="Align Right"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bold & Italic Toggle */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCaption((c) => ({ ...c, bold: !c.bold }))}
                      className={`px-2 py-1 text-xs font-mono font-bold border transition rounded-[8px] ${
                        caption.bold ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      B
                    </button>
                    <button
                      onClick={() => setCaption((c) => ({ ...c, italic: !c.italic }))}
                      className={`px-2 py-1 text-xs font-mono italic border transition rounded-[8px] ${
                        caption.italic ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      I
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Export Download Button */}
            <button
              onClick={handleExportSingle}
              disabled={!selectedImage}
              className="w-full py-3 bg-gray-900 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-30 transition cursor-pointer shadow-sm rounded-[8px]"
            >
              Process & Export
            </button>
          </>
        ) : (
          /* BATCH PROCESSING PANEL */
          <div className="space-y-6">
            <section className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                Add Images to Batch
              </p>
              <div className="relative border border-dashed border-gray-300 hover:border-gray-800 p-6 bg-gray-50 text-center cursor-pointer rounded-[8px]">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleBatchFileAdd(e.target.files)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Plus className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Select Batch Files</span>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-sans font-semibold">
                  Queue ({batchItems.length})
                </p>
                <button
                  onClick={() => setBatchItems([])}
                  className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900"
                >
                  Clear
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {batchItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 text-xs rounded-[8px]"
                  >
                    <div className="flex items-center gap-3 truncate pr-2">
                      <img src={item.previewUrl} alt="" className="w-8 h-8 object-cover border border-gray-300 rounded-[8px]" />
                      <div className="truncate">
                        <div className="text-gray-900 font-medium truncate">{item.name}</div>
                        <div className="text-[9px] text-gray-500 font-mono">
                          {item.originalWidth}x{item.originalHeight} px
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'done' && (
                        <a
                          href={item.processedUrl}
                          download={`resized_${item.name}`}
                          className="p-1 bg-gray-900 text-white hover:bg-gray-800 rounded-[8px]"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => setBatchItems((prev) => prev.filter((i) => i.id !== item.id))}
                        className="text-gray-400 hover:text-gray-900"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <button
              onClick={handleBatchProcessAll}
              disabled={batchItems.length === 0}
              className="w-full py-3 bg-gray-900 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-30 transition cursor-pointer shadow-sm rounded-[8px]"
            >
              Process Batch ({batchItems.length})
            </button>
          </div>
        )}
      </div>

      {/* Right Canvas Preview Window */}
      <div className="flex-1 bg-[#F5F5F7] p-8 flex flex-col items-center justify-center relative overflow-auto">
        {/* Top Floating Zoom & Info Controls */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-10">
          <div className="pointer-events-auto flex items-center gap-3 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-gray-300 shadow-sm text-[10px] font-mono text-gray-900 rounded-[8px]">
            <span className="font-bold">
              {convertToPixels(width, unit, dpi)} x {convertToPixels(height, unit, dpi)} PX
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">{dpi} DPI</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-800 font-medium">{estimatedSize}</span>
          </div>

          <div className="pointer-events-auto flex items-center gap-1 bg-white/90 backdrop-blur-md border border-gray-300 shadow-sm p-1 text-[10px] font-mono rounded-[8px]">
            <button
              onClick={() => setPreviewZoom((z) => Math.max(25, z - 25))}
              className="px-2 py-0.5 text-gray-500 hover:text-gray-900 font-bold rounded-[8px]"
            >
              -
            </button>
            <span className="px-1 text-gray-900 font-bold">{previewZoom}%</span>
            <button
              onClick={() => setPreviewZoom((z) => Math.min(200, z + 25))}
              className="px-2 py-0.5 text-gray-500 hover:text-gray-900 font-bold rounded-[8px]"
            >
              +
            </button>
          </div>
        </div>

        {/* Live Canvas Mount */}
        {selectedImage ? (
          <div className="p-6 bg-white border border-gray-300 shadow-xl max-w-full max-h-full flex items-center justify-center overflow-auto relative group rounded-[8px]">
            <canvas
              ref={previewCanvasRef}
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                maxHeight: '65vh',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
              className="shadow-md bg-white border border-gray-200 rounded-[8px]"
            />
          </div>
        ) : (
          <div className="text-center p-12 border border-gray-300 bg-white max-w-md shadow-sm rounded-[8px]">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-serif italic text-gray-900 mb-2">No Photo Active</h3>
            <p className="text-xs text-gray-500 mb-6">
              Upload a custom image or click <span className="text-gray-900 font-bold uppercase tracking-wider">"Sample Photo"</span> in the header to preview the Studio Light layout engine.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
