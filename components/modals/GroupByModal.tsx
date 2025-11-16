import React, { useState, useMemo } from 'react';
import { X, BarChart3, Plus, Trash2 } from 'lucide-react';
import { GroupByTransformation, AggregationConfig } from '../../types.ts';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  columns: string[];
  onClose: () => void;
  onApply: (transform: GroupByTransformation) => void;
}

const newAggregation = (firstColumn: string): AggregationConfig => ({
    id: uuidv4(),
    column: firstColumn,
    operation: 'sum',
    newColumnName: `Sum of ${firstColumn}`
});

export const GroupByModal: React.FC<Props> = ({ columns, onClose, onApply }) => {
    const numericColumns = useMemo(() => {
        // This is a heuristic. A real implementation would check data types.
        return columns; 
    }, [columns]);
    
    const [groupByColumns, setGroupByColumns] = useState<string[]>([]);
    const [aggregations, setAggregations] = useState<AggregationConfig[]>([newAggregation(numericColumns[0])]);
    
    const toggleGroupByColumn = (col: string) => {
        setGroupByColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
    };

    const updateAggregation = (id: string, newValues: Partial<AggregationConfig>) => {
        setAggregations(ags => ags.map(agg => {
            if (agg.id === id) {
                const updatedAgg = { ...agg, ...newValues };
                if ('operation' in newValues || 'column' in newValues) {
                     updatedAgg.newColumnName = `${updatedAgg.operation.charAt(0).toUpperCase() + updatedAgg.operation.slice(1)} of ${updatedAgg.column}`;
                }
                return updatedAgg;
            }
            return agg;
        }));
    };
    
    const addAggregation = () => setAggregations([...aggregations, newAggregation(numericColumns[0])]);
    const removeAggregation = (id: string) => setAggregations(aggregations.filter(agg => agg.id !== id));
    
    const handleApply = () => {
        if (groupByColumns.length > 0 && aggregations.length > 0) {
            onApply({
                type: 'group_by',
                payload: { groupByColumns, aggregations }
            });
            onClose();
        }
    };
    
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
            <div role="dialog" className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-6 pb-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center"><BarChart3 size={20} className="mr-3 text-primary-600" />Group & Summarize Data</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
                </header>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-2">1. Group by</h4>
                        <p className="text-sm text-slate-500 mb-3">Select one or more columns to group your data by.</p>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 h-64 overflow-y-auto space-y-2">
                            {columns.map(col => (
                                <label key={col} className="flex items-center p-2 rounded-md hover:bg-slate-200/50 cursor-pointer">
                                    <input type="checkbox" checked={groupByColumns.includes(col)} onChange={() => toggleGroupByColumn(col)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"/>
                                    <span className="text-slate-800">{col}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-slate-800 mb-2">2. Summarize</h4>
                        <p className="text-sm text-slate-500 mb-3">Define how to aggregate the other columns.</p>
                        <div className="space-y-3">
                            {aggregations.map(agg => (
                                <div key={agg.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50 border border-slate-200">
                                    <select value={agg.operation} onChange={e => updateAggregation(agg.id, { operation: e.target.value as any })} className="col-span-4 w-full p-2 border bg-white text-slate-900 border-slate-300 rounded-lg text-sm">
                                        <option value="sum">Sum</option>
                                        <option value="average">Average</option>
                                        <option value="count">Count</option>
                                        <option value="min">Min</option>
                                        <option value="max">Max</option>
                                    </select>
                                    <select value={agg.column} onChange={e => updateAggregation(agg.id, { column: e.target.value })} className="col-span-5 w-full p-2 border bg-white text-slate-900 border-slate-300 rounded-lg text-sm">
                                        {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <input type="text" value={agg.newColumnName} onChange={e => updateAggregation(agg.id, { newColumnName: e.target.value })} className="col-span-12 mt-1 w-full p-2 border bg-white text-slate-900 border-slate-300 rounded-lg text-sm" />

                                    <div className="col-span-3 text-sm text-slate-500 font-medium"> of </div>
                                    <div className="col-span-1">
                                        {aggregations.length > 1 && <button onClick={() => removeAggregation(agg.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                         <button onClick={addAggregation} className="mt-4 flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-100 hover:bg-primary-200 rounded-md"><Plus size={14} className="mr-2"/> Add Aggregation</button>
                    </div>
                </div>

                <footer className="p-6 pt-4 border-t border-slate-200 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
                    <button onClick={handleApply} disabled={groupByColumns.length === 0 || aggregations.length === 0} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm disabled:bg-slate-300">Apply Transformation</button>
                </footer>
            </div>
        </div>
    );
};
