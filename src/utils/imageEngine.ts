import { CaptionConfig, DimensionUnit, ImageExportFormat, ImagePreset, ImageResizeConfig } from '../types';

export const IMAGE_PRESETS: ImagePreset[] = [
  {
    id: 'passport_us',
    name: 'US Passport Photo',
    category: 'id',
    width: 2,
    height: 2,
    unit: 'in',
    dpi: 300,
    description: '2 x 2 inches (600x600 px @ 300 DPI)'
  },
  {
    id: 'passport_eu',
    name: 'EU / UK / India Passport Photo',
    category: 'id',
    width: 3.5,
    height: 4.5,
    unit: 'cm',
    dpi: 300,
    description: '3.5 x 4.5 cm (413x531 px @ 300 DPI)'
  },
  {
    id: 'id_card',
    name: 'CR80 Standard ID Card',
    category: 'id',
    width: 8.56,
    height: 5.4,
    unit: 'cm',
    dpi: 300,
    description: '8.56 x 5.4 cm (85.6 x 54 mm)'
  },
  {
    id: 'ig_post',
    name: 'Instagram Square Post',
    category: 'social',
    width: 1080,
    height: 1080,
    unit: 'px',
    dpi: 96,
    description: '1080 x 1080 px'
  },
  {
    id: 'ig_story',
    name: 'Instagram Story / Reel',
    category: 'social',
    width: 1080,
    height: 1920,
    unit: 'px',
    dpi: 96,
    description: '1080 x 1920 px (9:16)'
  },
  {
    id: 'yt_thumb',
    name: 'YouTube Thumbnail',
    category: 'social',
    width: 1280,
    height: 720,
    unit: 'px',
    dpi: 96,
    description: '1280 x 720 px (16:9)'
  },
  {
    id: 'social_banner',
    name: 'Social Media Header Banner',
    category: 'social',
    width: 1200,
    height: 630,
    unit: 'px',
    dpi: 96,
    description: '1200 x 630 px'
  },
  {
    id: 'print_4x6',
    name: 'Print Photo 4x6"',
    category: 'print',
    width: 4,
    height: 6,
    unit: 'in',
    dpi: 300,
    description: '4 x 6 inches (1200x1800 px)'
  },
  {
    id: 'print_5x7',
    name: 'Print Photo 5x7"',
    category: 'print',
    width: 5,
    height: 7,
    unit: 'in',
    dpi: 300,
    description: '5 x 7 inches (1500x2100 px)'
  }
];

export function convertToPixels(val: number, unit: DimensionUnit, dpi: number = 300): number {
  switch (unit) {
    case 'in':
      return Math.round(val * dpi);
    case 'cm':
      return Math.round((val / 2.54) * dpi);
    case 'mm':
      return Math.round((val / 25.4) * dpi);
    case 'px':
    default:
      return Math.round(val);
  }
}

export function convertFromPixels(pixels: number, unit: DimensionUnit, dpi: number = 300): number {
  switch (unit) {
    case 'in':
      return Number((pixels / dpi).toFixed(2));
    case 'cm':
      return Number(((pixels / dpi) * 2.54).toFixed(2));
    case 'mm':
      return Number(((pixels / dpi) * 25.4).toFixed(1));
    case 'px':
    default:
      return pixels;
  }
}

export async function processImageToCanvas(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  config: ImageResizeConfig
): Promise<HTMLCanvasElement> {
  const targetPxWidth = convertToPixels(config.width, config.unit, config.dpi);
  const targetPxHeight = convertToPixels(config.height, config.unit, config.dpi);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get 2D canvas context');

  const { caption } = config;
  const hasText = caption.text.trim().length > 0;
  const isFooterBand = hasText && caption.mode === 'footer_band';

  let footerBandHeight = 0;
  if (isFooterBand) {
    // Dynamic footer band height based on font size & padding
    footerBandHeight = caption.fontSize + caption.padding * 2 + (caption.subtext ? caption.fontSize * 0.7 + 6 : 0);
  }

  // Total canvas dimensions
  canvas.width = targetPxWidth;
  canvas.height = targetPxHeight + (isFooterBand ? footerBandHeight : 0);

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Smooth rendering settings
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw main image into targetPxWidth x targetPxHeight area
  ctx.drawImage(imageSource, 0, 0, targetPxWidth, targetPxHeight);

  // Handle Captioning / Text Overlay
  if (hasText) {
    if (isFooterBand) {
      // Draw Footer Band Strip
      const bandY = targetPxHeight;
      ctx.save();
      ctx.fillStyle = caption.backgroundColor || '#0f172a';
      ctx.globalAlpha = caption.backgroundOpacity;
      ctx.fillRect(0, bandY, targetPxWidth, footerBandHeight);
      ctx.restore();

      // Configure text font
      ctx.font = `${caption.bold ? 'bold ' : ''}${caption.italic ? 'italic ' : ''}${caption.fontSize}px ${caption.fontFamily}`;
      ctx.fillStyle = caption.textColor;
      ctx.textAlign = caption.alignment;
      ctx.textBaseline = 'top';

      let textX = caption.padding;
      if (caption.alignment === 'center') textX = targetPxWidth / 2;
      if (caption.alignment === 'right') textX = targetPxWidth - caption.padding;

      const mainTextY = bandY + caption.padding;
      ctx.fillText(caption.text, textX, mainTextY);

      if (caption.subtext) {
        const subFontSize = Math.max(11, Math.round(caption.fontSize * 0.7));
        ctx.font = `${caption.italic ? 'italic ' : ''}${subFontSize}px ${caption.fontFamily}`;
        ctx.globalAlpha = 0.85;
        ctx.fillText(caption.subtext, textX, mainTextY + caption.fontSize + 4);
      }
    } else {
      // Direct Overlay on Image
      ctx.save();

      const overlayStyle = caption.overlayStyle || 'full_width';
      const position = caption.position || 'bottom';
      const yOffset = caption.yOffset || 0;

      ctx.font = `${caption.bold ? 'bold ' : ''}${caption.italic ? 'italic ' : ''}${caption.fontSize}px ${caption.fontFamily}`;
      ctx.textAlign = caption.alignment;
      ctx.textBaseline = 'top';

      const subFontSize = caption.subtext ? Math.max(11, Math.round(caption.fontSize * 0.7)) : 0;
      const totalContentHeight = caption.fontSize + (caption.subtext ? subFontSize + 6 : 0);
      const bgHeight = totalContentHeight + caption.padding * 2;

      // Calculate vertical background position bgY
      let bgY = targetPxHeight - bgHeight - yOffset; // default bottom flush
      if (position === 'top') {
        bgY = 0 + yOffset;
      } else if (position === 'center') {
        bgY = Math.round((targetPxHeight - bgHeight) / 2) + yOffset;
      }

      const mainTextY = bgY + caption.padding;

      if (overlayStyle === 'full_width') {
        // Draw Full-Width Overlay Strip across bottom/top/center
        if (caption.backgroundOpacity > 0) {
          ctx.fillStyle = caption.backgroundColor || '#000000';
          ctx.globalAlpha = caption.backgroundOpacity !== undefined ? caption.backgroundOpacity : 1.0;
          ctx.fillRect(0, bgY, targetPxWidth, bgHeight);
          ctx.globalAlpha = 1.0;
        }

        let textX = caption.padding;
        if (caption.alignment === 'center') textX = targetPxWidth / 2;
        if (caption.alignment === 'right') textX = targetPxWidth - caption.padding;

        ctx.fillStyle = caption.textColor || '#ffffff';
        ctx.fillText(caption.text, textX, mainTextY);

        if (caption.subtext) {
          ctx.font = `${caption.italic ? 'italic ' : ''}${subFontSize}px ${caption.fontFamily}`;
          ctx.globalAlpha = 0.9;
          ctx.fillText(caption.subtext, textX, mainTextY + caption.fontSize + 4);
        }
      } else {
        // Fitted Box Overlay
        const mainTextMetrics = ctx.measureText(caption.text);
        let subTextWidth = 0;
        if (caption.subtext) {
          ctx.font = `${caption.italic ? 'italic ' : ''}${subFontSize}px ${caption.fontFamily}`;
          subTextWidth = ctx.measureText(caption.subtext).width;
          ctx.font = `${caption.bold ? 'bold ' : ''}${caption.italic ? 'italic ' : ''}${caption.fontSize}px ${caption.fontFamily}`;
        }

        const maxTextWidth = Math.max(mainTextMetrics.width, subTextWidth);
        const bgWidth = maxTextWidth + caption.padding * 2;

        let bgX = (targetPxWidth - bgWidth) / 2;
        if (caption.alignment === 'left') bgX = caption.padding;
        if (caption.alignment === 'right') bgX = targetPxWidth - bgWidth - caption.padding;

        if (caption.backgroundOpacity > 0) {
          ctx.fillStyle = caption.backgroundColor || '#000000';
          ctx.globalAlpha = caption.backgroundOpacity !== undefined ? caption.backgroundOpacity : 1.0;
          ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
          ctx.globalAlpha = 1.0;
        }

        let textX = bgX + bgWidth / 2;
        if (caption.alignment === 'left') textX = bgX + caption.padding;
        if (caption.alignment === 'right') textX = bgX + bgWidth - caption.padding;

        ctx.fillStyle = caption.textColor || '#ffffff';
        ctx.fillText(caption.text, textX, mainTextY);

        if (caption.subtext) {
          ctx.font = `${caption.italic ? 'italic ' : ''}${subFontSize}px ${caption.fontFamily}`;
          ctx.globalAlpha = 0.9;
          ctx.fillText(caption.subtext, textX, mainTextY + caption.fontSize + 4);
        }
      }

      ctx.restore();
    }
  }

  return canvas;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageExportFormat = 'image/jpeg',
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      },
      format,
      quality
    );
  });
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
