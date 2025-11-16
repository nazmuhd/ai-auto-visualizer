import React, { useState } from 'react';
import { X, Filter, Plus, Trash2 } from 'lucide-react';
import { FilterTransformation, FilterClause, FilterCondition } from '../../types.ts';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  columns: string[];
  onClose: () => void;
  onApply: (filter: FilterTransformation) => void;
}

const CONDITIONS: { value: FilterCondition; label: string; types: ('string'|'number')[] }[] = [
    { value: 'contains', label: 'contains', types: ['string'] },
    { value: 'does_not_contain', label: 'does not contain', types: ['string'] },
    { value: 'is', label: 'is', types: ['string'] },
    { value: 'is_not', label: 'is not', types: ['string'] },
    { value: 'starts_with', label: 'starts with', types: ['string'] },
    { value: 'ends_with', label: 'ends with', types: ['string'] },
    { value: 'is_empty', label: 'is empty', types: ['string', 'number'] },
    { value: 'is_not_empty', label: 'is not empty', types: ['string', 'number'] },
    { value: 'is_greater_than', label: 'is greater than', types: ['number'] },
    { value: 'is_less_than', label: 'is less than', types: ['number'] },
    { value: 'is_equal_to', label: 'is equal to', types: ['number'] },
    { value: 'is_not_equal_to', label: 'is not equal to', types: ['number'] },
];

const newClause = (firstColumn: string): FilterClause => ({
  id: uuidv4(),
  column: firstColumn,
  condition: 'contains',
  value: '',
});

export const FilterRowsModal: React.FC<Props> = ({ columns, onClose, onApply }) => {
  const [clauses, setClauses] = useState<FilterClause[]>([newClause(columns[0])]);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');

  const updateClause = (id: string, newValues: Partial<FilterClause>) => {
    setClauses(clauses.map(c => (c.id === id ? { ...c, ...newValues } : c)));
  };

  const removeClause = (id: string) => {
    setClauses(clauses.filter(c => c.id !== id));
  };
  
  const addClause = () => {
    setClauses([...clauses, newClause(columns[0])]);
  };

  const handleApply = () => {
    const validClauses = clauses.filter(c => c.value !== '' || c.condition === 'is_empty' || c.condition === 'is_not_empty');
    if (validClauses.length > 0) {
        onApply({ type: 'filter', payload: { logic, clauses: validClauses } });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 pb-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900 flex items-center"><Filter size={20} className="mr-3 text-primary-600" />Filter Rows</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
        </header>

        <div className="p-6 space-y-4">
          {clauses.map((clause, index) => (
            <div key={clause.id} className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-1 text-sm text-slate-500 font-medium">{index === 0 ? 'Where' : logic}</span>
              <select value={clause.column} onChange={e => updateClause(clause.id, { column: e.target.value, condition: 'contains' })} className="col-span-3 w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg text-sm">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={clause.condition} onChange={e => updateClause(clause.id, { condition: e.target.value as FilterCondition })} className="col-span-3 w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg text-sm">
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {clause.condition !== 'is_empty' && clause.condition !== 'is_not_empty' && (
                <input type="text" value={clause.value} onChange={e => updateClause(clause.id, { value: e.target.value })} className="col-span-4 w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg text-sm" />
              )}
              {clauses.length > 1 && (
                <button onClick={() => removeClause(clause.id)} className="col-span-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between">
            <button onClick={addClause} className="flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-100 hover:bg-primary-200 rounded-md"><Plus size={14} className="mr-2"/> Add Condition</button>
            {clauses.length > 1 && (
                <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                    <button onClick={() => setLogic('AND')} className={`px-3 py-1 text-xs font-semibold rounded-md ${logic === 'AND' ? 'bg-primary-600 text-white shadow' : 'text-slate-600'}`}>AND</button>
                    <button onClick={() => setLogic('OR')} className={`px-3 py-1 text-xs font-semibold rounded-md ${logic === 'OR' ? 'bg-primary-600 text-white shadow' : 'text-slate-600'}`}>OR</button>
                </div>
            )}
          </div>
        </div>

        <footer className="p-6 pt-4 border-t border-slate-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
          <button onClick={handleApply} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm">Apply Filters</button>
        </footer>
      </div>
    </div>
  );
};
