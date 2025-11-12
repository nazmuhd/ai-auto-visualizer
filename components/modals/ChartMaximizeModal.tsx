import React from 'react';
import { ChartConfig, DataRow } from '../../types.ts';
import { ChartRenderer } from '../charts/ChartRenderer.tsx';
import { X, Maximize } from 'lucide-react';

interface Props {
  config: ChartConfig;
  data: DataRow[];
  dateColumn: string | null;
  onUpdate: (newConfig: ChartConfig) => void;
  onClose: () => void;
}

export const ChartMaximizeModal: React.FC<Props> = ({ config, data, dateColumn, onUpdate, onClose }) => {
  if (!config) return null;

  return (
    <div 
        className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
    >
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="maximize-chart-title" 
        className="bg-slate-50 rounded-2xl shadow-2xl w-[95vw] h-[90vh] animate-in zoom-in-95 duration-200 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center">
                 <Maximize size={20} className="text-primary-600 mr-3" />
                 <h3 id="maximize-chart-title" className="text-xl font-bold text-slate-900">{config.title}</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100">
                <X size={20} />
            </button>
        </header>
        <div className="flex-1 p-4 overflow-hidden">
            <ChartRenderer 
                config={config} 
                data={data} 
                dateColumn={dateColumn} 
                onUpdate={onUpdate}
                onMaximize={() => {}} // Disable maximize button inside modal
                enableScrollZoom={true} // Enable scroll-to-zoom feature
            />
        </div>
      </div>
    </div>
  );
};