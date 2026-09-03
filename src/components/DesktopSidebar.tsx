import React from 'react';
import {
  Cpu,
  FileCode2,
  FileText,
  HardDrive,
  Image as ImageIcon,
  RefreshCw,
  Shield,
  Zap,
} from 'lucide-react';
import { WorkspaceTab } from '../types';

interface DesktopSidebarProps {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  imageCount: number;
  pdfPagesCount: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  setActiveTab,
  imageCount,
  pdfPagesCount,
}) => {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 text-gray-800 flex flex-col justify-between select-none shrink-0 p-4">
      <div className="space-y-8">
        {/* Workspace Switcher Section */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-4 font-sans font-semibold">
            Workspace
          </p>
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('image')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition rounded-[8px] ${
                activeTab === 'image'
                  ? 'bg-gray-100 border-l-2 border-gray-900 text-gray-900 font-bold'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <ImageIcon className="w-4 h-4" />
                <span>Image Studio</span>
              </div>
              {imageCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] bg-gray-200 text-gray-800 font-mono font-bold uppercase rounded-[8px]">
                  {imageCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pdf')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition rounded-[8px] ${
                activeTab === 'pdf'
                  ? 'bg-gray-100 border-l-2 border-gray-900 text-gray-900 font-bold'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>PDF Editor</span>
              </div>
              {pdfPagesCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] bg-gray-200 text-gray-800 font-mono font-bold uppercase rounded-[8px]">
                  {pdfPagesCount} pgs
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('converter')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition rounded-[8px] ${
                activeTab === 'converter'
                  ? 'bg-gray-100 border-l-2 border-gray-900 text-gray-900 font-bold'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4" />
                <span>File Converter</span>
              </div>
            </button>
          </div>
        </div>

        {/* System Architecture Section */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-4 font-sans font-semibold">
            System
          </p>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold transition rounded-[8px] ${
              activeTab === 'architecture'
                ? 'bg-gray-100 border-l-2 border-gray-900 text-gray-900 font-bold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Architecture Specs</span>
          </button>
        </div>

        {/* Status / Queue Card in Clean Light Editorial Style */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-[8px]">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-gray-800" />
            <span>Engine Active</span>
          </p>
          <p className="text-xl font-serif italic text-gray-900">
            {imageCount || pdfPagesCount ? `${imageCount + pdfPagesCount} Files Queued` : '100% Local Engine'}
          </p>
          <div className="w-full h-1 bg-gray-200 mt-3 overflow-hidden">
            <div className="w-1/3 h-full bg-gray-900" />
          </div>
        </div>
      </div>

      {/* Footer System Resources Hardware Status */}
      <div className="pt-4 border-t border-gray-200 text-[10px] text-gray-500 space-y-2 font-mono">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-gray-600">
            <Cpu className="w-3 h-3 text-gray-700" />
            <span>Process</span>
          </span>
          <span className="text-gray-900 font-bold">Client IPC</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[9px] uppercase tracking-wider text-gray-500">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-gray-700" />
              <span>Heap Allocation</span>
            </span>
            <span className="text-gray-900 font-bold">32%</span>
          </div>
          <div className="w-full bg-gray-200 h-1 overflow-hidden">
            <div className="bg-gray-900 h-full w-[32%]" />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-[9px] uppercase tracking-widest text-gray-400 border-t border-gray-100">
          <span className="flex items-center gap-1 text-gray-600">
            <Shield className="w-3 h-3" />
            <span>Sandboxed</span>
          </span>
          <span className="text-gray-700 font-medium">Offline</span>
        </div>
      </div>
    </aside>
  );
};

