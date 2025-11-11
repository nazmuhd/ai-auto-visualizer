import React from 'react';
import { X, Sun, Moon } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 relative" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Settings</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
                <div className="flex items-center space-x-2">
                    <button className="flex-1 flex items-center justify-center p-3 rounded-lg border-2 border-primary-500 bg-primary-50 text-primary-700 font-semibold">
                        <Sun size={16} className="mr-2"/> Light
                    </button>
                     <button className="flex-1 flex items-center justify-center p-3 rounded-lg border border-slate-300 bg-white text-slate-500 font-medium hover:bg-slate-50">
                        <Moon size={16} className="mr-2"/> Dark
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">Dark mode is coming soon!</p>
            </div>
             <div>
                <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-700 mb-1">Gemini API Key</label>
                <input 
                    id="api-key-input"
                    type="password" 
                    placeholder="Using built-in key"
                    className="w-full px-3 py-2 border bg-slate-100 text-slate-500 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none cursor-not-allowed" 
                    disabled
                />
                 <p className="text-xs text-slate-400 mt-2">The ability to use your own API key will be added in a future update.</p>
            </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium">Done</button>
        </div>
      </div>
    </div>
  );
};
