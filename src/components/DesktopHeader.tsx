import React from 'react';
import {
  AppWindow,
  FileCode2,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Maximize2,
  Minus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { WorkspaceTab } from '../types';

interface DesktopHeaderProps {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  onLoadSampleImage: () => void;
  onLoadSamplePdf: () => void;
  activeFileName?: string;
  isProcessing: boolean;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  activeTab,
  setActiveTab,
  onLoadSampleImage,
  onLoadSamplePdf,
  activeFileName,
  isProcessing,
}) => {
  return (
    <header className="bg-white text-gray-900 border-b border-gray-200 select-none flex flex-col">
      {/* Top OS Window Bar */}
      <div className="flex items-center justify-between px-6 py-2 bg-[#F9FAFB] text-xs text-gray-500 border-b border-gray-200">
        <div className="flex items-center gap-6">
          {/* OS Window Control Buttons */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57] hover:opacity-80 transition cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:opacity-80 transition cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#28C840] hover:opacity-80 transition cursor-pointer" />
          </div>

          <div className="flex items-center gap-3">
            <h1 className="font-serif italic text-lg tracking-tight text-gray-900">
              OmniStudio <span className="text-xs font-sans not-italic ml-2 text-gray-400 uppercase tracking-[0.2em]">v2.4.0</span>
            </h1>
          </div>

          {activeFileName && (
            <div className="hidden md:flex items-center gap-2 text-gray-400 border-l border-gray-200 pl-4 font-mono text-[11px]">
              <span className="uppercase tracking-widest text-[9px] text-gray-500">Doc:</span>
              <span className="text-gray-800 truncate max-w-[200px] font-medium">
                {activeFileName}
              </span>
            </div>
          )}
        </div>

        {/* Local Security & Status Badge */}
        <div className="flex items-center gap-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 font-sans hidden sm:block">
            Local Runtime: Browser Canvas + WebAssembly
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] uppercase tracking-widest font-mono font-bold rounded-[8px]">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>100% Offline</span>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-1.5 text-gray-900 text-[11px] font-mono animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-gray-700" />
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Desktop Action Navigation Strip */}
      <div className="flex items-center justify-between px-6 py-2 bg-white">
        <nav className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition rounded-[8px] ${
              activeTab === 'image'
                ? 'bg-gray-900 text-white shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition rounded-[8px] ${
              activeTab === 'pdf'
                ? 'bg-gray-900 text-white shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('converter')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition rounded-[8px] ${
              activeTab === 'converter'
                ? 'bg-gray-900 text-white shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>File Converter</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition rounded-[8px] ${
              activeTab === 'architecture'
                ? 'bg-gray-900 text-white shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Blueprint</span>
          </button>
        </nav>

        {/* Quick Sample Demo Loaders */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLoadSampleImage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-xs font-semibold uppercase tracking-wider transition rounded-[8px]"
            title="Load high resolution sample photo"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Sample Photo</span>
          </button>
          <button
            onClick={onLoadSamplePdf}
            className="px-4 py-1.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition rounded-[8px]"
            title="Load sample 3-page PDF document"
          >
            <FolderOpen className="w-3 h-3 inline mr-1.5" />
            <span>Sample PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};

