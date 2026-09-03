import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface StatusBarProps {
  statusMessage: string;
  activeDetails?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ statusMessage, activeDetails }) => {
  return (
    <footer className="bg-[#FAFAFA] border-t border-gray-200 text-gray-600 text-xs px-6 py-2 flex items-center justify-between select-none shrink-0 font-mono">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="text-gray-800 font-medium truncate max-w-xl">{statusMessage}</span>
      </div>

      <div className="flex items-center gap-6 text-[10px] uppercase tracking-wider">
        {activeDetails && <span className="text-gray-500 border-r border-gray-200 pr-4">{activeDetails}</span>}

        <div className="flex items-center gap-1.5 text-gray-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local Execution</span>
        </div>
      </div>
    </footer>
  );
};

