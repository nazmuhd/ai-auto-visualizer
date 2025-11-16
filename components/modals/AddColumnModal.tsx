import React, { useState, useCallback } from 'react';
import { X, PlusCircle, Sparkles, Loader2 } from 'lucide-react';
import { AddColumnTransformation } from '../../types.ts';
import { generateFormulaFromNaturalLanguage } from '../../services/geminiService.ts';

interface Props {
  columns: string[];
  onClose: () => void;
  onApply: (transform: AddColumnTransformation) => void;
}

export const AddColumnModal: React.FC<Props> = ({ columns, onClose, onApply }) => {
  const [newColumnName, setNewColumnName] = useState('');
  const [formula, setFormula] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateFormula = useCallback(async () => {
    if (!aiQuery.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const generatedFormula = await generateFormulaFromNaturalLanguage(aiQuery, columns);
      setFormula(generatedFormula);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [aiQuery, columns]);

  const handleApply = () => {
    if (newColumnName.trim() && formula.trim()) {
      onApply({
        type: 'add_column',
        payload: { newColumnName: newColumnName.trim(), formula: formula.trim() }
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 pb-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900 flex items-center"><PlusCircle size={20} className="mr-3 text-primary-600" />Add Custom Column</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
        </header>

        <div className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Column Name</label>
                <input type="text" value={newColumnName} onChange={e => setNewColumnName(e.target.value)} placeholder="e.g., Profit" className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"/>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Formula</label>
                <p className="text-xs text-slate-500 mb-2">Use column names in brackets, e.g., <code className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded">[Revenue] - [Cost]</code></p>
                <textarea value={formula} onChange={e => setFormula(e.target.value)} rows={2} className="w-full p-2 border bg-white text-slate-900 border-slate-300 rounded-lg font-mono text-sm tracking-tighter" />
            </div>
             <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <label className="block text-sm font-medium text-primary-800 mb-1">Or, ask AI to create a formula</label>
                <div className="flex items-center space-x-2">
                    <input type="text" value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerateFormula()} placeholder="e.g., revenue minus cost to calculate profit" className="flex-1 w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg"/>
                    <button onClick={handleGenerateFormula} disabled={isGenerating} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium shadow-sm hover:bg-primary-700 disabled:bg-primary-300 flex items-center">
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        <span className="ml-2">Generate</span>
                    </button>
                </div>
                 {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            </div>
        </div>

        <footer className="p-6 pt-4 border-t border-slate-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
          <button onClick={handleApply} disabled={!newColumnName.trim() || !formula.trim()} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm disabled:bg-slate-300">Add Column</button>
        </footer>
      </div>
    </div>
  );
};
