import React, { useState, useEffect } from 'react';
import { KpiConfig } from '../../types.ts';
import { X, Save, Edit, PlusCircle, AlertCircle, Trash2, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visibleIds: Set<string>, newKpis: KpiConfig[]) => void;
  allKpis: KpiConfig[];
  visibleKpiIds: Set<string>;
  availableColumns: string[];
}

const DEFAULT_KPI: Omit<KpiConfig, 'id'> = { title: '', column: '', operation: 'sum', format: 'number', isCustom: true };

export const KpiManagerModal: React.FC<Props> = ({ isOpen, onClose, onSave, allKpis, visibleKpiIds, availableColumns }) => {
  const [currentVisibleIds, setCurrentVisibleIds] = useState(new Set(visibleKpiIds));
  const [newCustomKpis, setNewCustomKpis] = useState<KpiConfig[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newKpiForm, setNewKpiForm] = useState<Omit<KpiConfig, 'id'>>(DEFAULT_KPI);

  useEffect(() => {
    if (isOpen) {
      setCurrentVisibleIds(new Set(visibleKpiIds));
      setNewCustomKpis([]);
      setIsAdding(false);
    }
  }, [isOpen, visibleKpiIds]);
  
  const handleToggle = (id: string) => {
    const newSet = new Set(currentVisibleIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCurrentVisibleIds(newSet);
  };
  
  const handleSave = () => {
      onSave(currentVisibleIds, newCustomKpis);
      onClose();
  };

  const handleAddCustomKpi = (e: React.FormEvent) => {
    e.preventDefault();
    const newKpi = { ...newKpiForm, id: `custom_${Date.now()}`};
    setNewCustomKpis(prev => [...prev, newKpi]);
    setCurrentVisibleIds(prev => new Set(prev).add(newKpi.id)); // Make it visible by default
    setIsAdding(false);
    setNewKpiForm(DEFAULT_KPI);
  }
  
  const combinedKpis = [...allKpis, ...newCustomKpis];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="kpi-modal-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center"><Edit size={20} className="mr-3 text-primary-600" /><h3 id="kpi-modal-title" className="text-xl font-bold text-slate-900">Manage Key Metrics</h3></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
            <p className="text-sm text-slate-500">Select which Key Performance Indicators (KPIs) you want to display on your dashboard. The AI has suggested the following based on your data.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {combinedKpis.map(kpi => (
                     <button key={kpi.id} onClick={() => handleToggle(kpi.id)} className={`p-3 border rounded-lg text-left flex items-center justify-between w-full transition-all ${currentVisibleIds.has(kpi.id) ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-200' : 'bg-white hover:bg-slate-50 border-slate-200'}`}>
                        <div>
                            <p className={`font-medium ${currentVisibleIds.has(kpi.id) ? 'text-primary-800' : 'text-slate-800'}`}>{kpi.title}</p>
                            <p className={`text-xs ${currentVisibleIds.has(kpi.id) ? 'text-primary-600' : 'text-slate-500'}`}>
                                {kpi.operation.replace('_', ' ')} of "{kpi.column}"
                                {kpi.isCustom && <span className="ml-2 text-blue-500">(Custom)</span>}
                            </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${currentVisibleIds.has(kpi.id) ? 'bg-primary-600 border-primary-600' : 'border-slate-300'}`}>
                           {currentVisibleIds.has(kpi.id) && <CheckCircle className="w-5 h-5 text-white" />}
                        </div>
                    </button>
                ))}
            </div>

            {isAdding ? (
                <form onSubmit={handleAddCustomKpi} className="p-4 border-2 border-dashed border-primary-300 rounded-lg bg-primary-50/50 mt-4 space-y-3 animate-in fade-in duration-200">
                    <h4 className="font-semibold text-primary-900">Add Custom KPI</h4>
                     <div className="grid grid-cols-2 gap-3">
                        <input value={newKpiForm.title} onChange={e => setNewKpiForm(f => ({...f, title: e.target.value}))} placeholder="KPI Title (e.g., Avg. Order Value)" required className="w-full px-3 py-2 text-sm border bg-white border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"/>
                        <select value={newKpiForm.column} onChange={e => setNewKpiForm(f => ({...f, column: e.target.value}))} required className="w-full px-3 py-2 text-sm border bg-white border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"><option value="">Select Column</option>{availableColumns.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <select value={newKpiForm.operation} onChange={e => setNewKpiForm(f => ({...f, operation: e.target.value as any}))} className="w-full px-3 py-2 text-sm border bg-white border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"><option value="sum">Sum</option><option value="average">Average</option><option value="count_distinct">Count Distinct</option></select>
                        <select value={newKpiForm.format} onChange={e => setNewKpiForm(f => ({...f, format: e.target.value as any}))} className="w-full px-3 py-2 text-sm border bg-white border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"><option value="number">Number</option><option value="currency">Currency</option><option value="percent">Percent</option></select>
                     </div>
                     <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
                        <button type="submit" className="px-3 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md">Add KPI</button>
                     </div>
                </form>
            ) : (
                <button onClick={() => setIsAdding(true)} className="w-full mt-4 p-3 border-2 border-dashed border-slate-300 hover:border-primary-400 hover:bg-primary-50/50 rounded-lg text-slate-500 hover:text-primary-600 font-medium text-sm flex items-center justify-center transition-colors">
                    <PlusCircle size={16} className="mr-2"/> Add Custom KPI
                </button>
            )}

            {allKpis.length <= 5 && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start text-sm text-slate-600">
                    <AlertCircle className="w-5 h-5 mr-2.5 flex-shrink-0 mt-0.5 text-slate-400" />
                    Based on the provided data, no additional key metrics could be automatically identified. You can add your own custom KPIs if needed.
                </div>
            )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
            <button type="button" onClick={handleSave} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm flex items-center">
                <Save size={16} className="mr-2" />
                Apply Changes
            </button>
        </div>
      </div>
    </div>
  );
};
