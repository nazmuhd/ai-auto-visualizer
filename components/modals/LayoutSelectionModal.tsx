import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { LayoutInfo } from '../../types.ts';

const LayoutSkeleton: React.FC<{ rows: number[] }> = ({ rows }) => (
    <div className="aspect-video w-full bg-slate-100 rounded-md p-2 flex flex-col gap-1.5 border border-slate-200">
        {rows.map((cols, rowIndex) => (
            <div key={rowIndex} className={`flex-1 grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {[...Array(cols)].map((_, colIndex) => (
                    <div key={colIndex} className="bg-slate-300 rounded-sm" />
                ))}
            </div>
        ))}
    </div>
);


export const LayoutSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentLayout: string;
  onSelectLayout: (layoutId: string) => void;
  layouts: LayoutInfo[];
}> = ({ isOpen, onClose, currentLayout, onSelectLayout, layouts }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm duration-200" onClick={onClose}>
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="layout-modal-title" 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] duration-200 relative flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h3 id="layout-modal-title" className="text-xl font-bold text-slate-900">Select Chart Layout</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {layouts.map((layout) => (
                    <button 
                        key={layout.id} 
                        onClick={() => onSelectLayout(layout.id)}
                        className={`relative text-left p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${currentLayout === layout.id ? 'border-primary-500 bg-primary-50/50 shadow-md' : 'border-slate-200 bg-white'}`}
                    >
                         {currentLayout === layout.id && (
                            <CheckCircle2 className="absolute top-3 right-3 w-6 h-6 text-primary-600 bg-white rounded-full" />
                        )}
                        <LayoutSkeleton rows={layout.rows} />
                        <div className="mt-4">
                            <h4 className="font-bold text-slate-800">{layout.name}</h4>
                            <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-semibold">Layout: {layout.id}</p>
                            <p className="text-sm text-slate-500 mt-1">{layout.description}</p>
                            <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-semibold">Used by: {layout.usedBy}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};