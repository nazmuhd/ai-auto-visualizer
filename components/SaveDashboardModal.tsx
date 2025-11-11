import React, { useState } from 'react';
import { X, Save, FileText } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName: string;
}

export const SaveDashboardModal: React.FC<Props> = ({ onClose, onSave, defaultName }) => {
  const [name, setName] = useState(defaultName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      onSave(name);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 relative" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Save Dashboard</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="dashboard-name" className="block text-sm font-medium text-slate-700 mb-1">Dashboard Name</label>
             <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    id="dashboard-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm flex items-center">
              <Save size={16} className="mr-2" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
