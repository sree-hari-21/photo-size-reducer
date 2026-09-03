export type WorkspaceTab = 'image' | 'pdf' | 'converter' | 'architecture';

export type DimensionUnit = 'px' | 'in' | 'cm' | 'mm';

export type ImageExportFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImagePreset {
  id: string;
  name: string;
  category: 'id' | 'social' | 'print' | 'custom';
  width: number;
  height: number;
  unit: DimensionUnit;
  dpi?: number;
  description: string;
}

export interface CaptionConfig {
  text: string;
  subtext?: string;
  mode: 'footer_band' | 'direct_overlay';
  position: 'bottom' | 'top' | 'center';
  overlayStyle?: 'full_width' | 'fitted_box';
  yOffset?: number; // vertical offset from edge (px)
  fontFamily: string;
  fontSize: number; // in px
  textColor: string;
  backgroundColor: string;
  backgroundOpacity: number; // 0 to 1
  alignment: 'left' | 'center' | 'right';
  padding: number;
  bold: boolean;
  italic: boolean;
}

export interface ImageResizeConfig {
  width: number;
  height: number;
  unit: DimensionUnit;
  dpi: number;
  maintainAspectRatio: boolean;
  originalWidth: number;
  originalHeight: number;
  quality: number; // 0 to 1
  format: ImageExportFormat;
  caption: CaptionConfig;
}

export interface BatchImageItem {
  id: string;
  name: string;
  file: File;
  previewUrl: string;
  originalWidth: number;
  originalHeight: number;
  processedUrl?: string;
  processedBlob?: Blob;
  status: 'idle' | 'processing' | 'done' | 'error';
}

export type PdfPageOrientation = 'portrait' | 'landscape';
export type PdfPageSize = 'A4' | 'Letter' | 'Fit';

export interface ImageToPdfSettings {
  pageSize: PdfPageSize;
  orientation: PdfPageOrientation;
  marginMm: number;
  quality: number;
  title: string;
}

export interface PdfToImageSettings {
  dpi: 72 | 150 | 300;
  format: 'png' | 'jpeg';
  pageRange: string; // e.g., 'all', '1,3,5-7'
}

export type AnnotationType = 'text' | 'signature' | 'date' | 'rectangle' | 'highlight' | 'redaction';

export interface PdfAnnotation {
  id: string;
  pageIndex: number; // 0-indexed
  type: AnnotationType;
  x: number; // percentage of page width (0 to 100)
  y: number; // percentage of page height (0 to 100)
  width: number; // percentage of page width
  height: number; // percentage of page height
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fillColor?: string;
  opacity?: number;
}

export interface PdfPageItem {
  pageIndex: number;
  rotation: number; // 0, 90, 180, 270
  selected: boolean;
  thumbnailUrl?: string;
}

export interface PdfDocumentState {
  file: File | null;
  name: string;
  numPages: number;
  pages: PdfPageItem[];
  arrayBuffer: ArrayBuffer | null;
  annotations: PdfAnnotation[];
}
