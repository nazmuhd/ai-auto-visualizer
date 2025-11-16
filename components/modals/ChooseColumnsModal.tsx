import React, { useState, useMemo } from 'react';
import { X, Columns, Search } from 'lucide-react';

interface Props {
  allColumns: string[];
  hiddenColumns: Set<string>;
  onClose: () => void;
  onApply: (columnsToHide: string[]) => void;
}

export const ChooseColumnsModal: React.FC<Props> = ({ allColumns, hiddenColumns, onClose, onApply }) => {
  const [search, setSearch] = useState('');
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(() => 
    Object.fromEntries(allColumns.map(col => [col, !hiddenColumns.has(col)]))
  );

  const filteredColumns = useMemo(() =>
    allColumns.filter(col => col.toLowerCase().includes(search.toLowerCase())),
    [allColumns, search]
  );

  const handleToggle = (column: string) => {
    setCheckedState(prev => ({ ...prev, [column]: !prev[column] }));
  };
  
  const handleSelectAll = (select: boolean) => {
      setCheckedState(Object.fromEntries(allColumns.map(col => [col, select])));
  }

  const handleApply = () => {
    const columnsToHide = Object.entries(checkedState)
      .filter(([, isChecked]) => !isChecked)
      .map(([columnName]) => columnName);
    
    // We only create a step if there's a change
    const newHiddenSet = new Set(columnsToHide);
    if (newHiddenSet.size !== hiddenColumns.size || ![...newHiddenSet].every(c => hiddenColumns.has(c))) {
        onApply(columnsToHide);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 pb-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900 flex items-center"><Columns size={20} className="mr-3 text-primary-600" />Choose Columns</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
        </header>
        <div className="p-4 border-b border-slate-100">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Search columns..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"/>
            </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                    <input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} checked={Object.values(checkedState).every(Boolean)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3" />
                    Select All
                </label>
            </div>
            <div className="space-y-2">
                {filteredColumns.map(col => (
                    <label key={col} className="flex items-center p-2 rounded-md hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={checkedState[col] ?? false} onChange={() => handleToggle(col)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"/>
                        <span className="text-slate-800">{col}</span>
                    </label>
                ))}
            </div>
        </div>
        <footer className="p-6 pt-4 border-t border-slate-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
          <button onClick={handleApply} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm">Apply</button>
        </footer>
      </div>
    </div>
  );
};
