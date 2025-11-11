import React from 'react';
import { X, Lightbulb, FileSpreadsheet, BarChart3 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 relative" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Help & Documentation</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-start">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-4"><Lightbulb size={20} /></div>
            <div>
              <h4 className="font-semibold text-slate-800">How It Works</h4>
              <p className="text-slate-600 text-sm mt-1">This tool uses Google's Gemini model to analyze your data. When you upload a file, a sample is sent to the AI, which then suggests relevant KPIs and chart configurations. The frontend then uses libraries like Recharts to render these visualizations based on your full dataset, which remains in your browser.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-4"><FileSpreadsheet size={20} /></div>
            <div>
              <h4 className="font-semibold text-slate-800">Supported Formats & Best Practices</h4>
              <p className="text-slate-600 text-sm mt-1">We currently support CSV, XLS, and XLSX files. For best results:</p>
              <ul className="list-disc list-inside text-sm text-slate-500 mt-2 space-y-1">
                <li>Ensure your first row contains clear column headers.</li>
                <li>Avoid merged cells or complex pivot table structures.</li>
                <li>Make sure dates are in a consistent format.</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg mr-4"><BarChart3 size={20} /></div>
            <div>
              <h4 className="font-semibold text-slate-800">Interpreting Charts</h4>
              <p className="text-slate-600 text-sm mt-1">The AI selects charts to highlight key aspects of your data, such as trends over time (Line Chart), comparisons between categories (Bar Chart), or proportional distributions (Pie Chart). Use the 3-dot menu on any chart to filter data or change the chart type yourself.</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium">Close</button>
        </div>
      </div>
    </div>
  );
};
