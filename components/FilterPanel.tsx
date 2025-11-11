
import React, { useMemo } from 'react';
import { DataRow } from '../types';
import { Filter, X, Check } from 'lucide-react';

interface Props {
    data: DataRow[];
    activeFilters: Record<string, Set<string>>;
    onFilterChange: (column: string, value: string) => void;
    onClearFilters: () => void;
}

export const FilterPanel: React.FC<Props> = ({ data, activeFilters, onFilterChange, onClearFilters }) => {
    // 1. Automatically detect suitable categorical columns
    const filterableColumns = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        const columns = Object.keys(data[0]);
        const candidates: { col: string; values: string[] }[] = [];
        const MAX_UNIQUE_VALUES = 30; // Only treat as categorical if it has few unique values

        columns.forEach(col => {
            // Quick sampling to avoid heavy processing on huge files
            // We assume if the first 500 rows have tons of unique values, it's not a good filter candidate.
            const sample = data.slice(0, 500);
            const uniqueValues = new Set(sample.map(row => String(row[col] || '')));
            
            // Filter out boring columns (all same value) or too high cardinality (IDs, timestamps)
            if (uniqueValues.size > 1 && uniqueValues.size <= MAX_UNIQUE_VALUES) {
                // If it passes sample check, get full unique list (might be slightly slower but accurate)
                // Explicitly type Array.from<string> to avoid potential 'unknown[]' inference issues
                const fullUnique: string[] = Array.from<string>(new Set(data.map(row => String(row[col] || ''))))
                    .filter(v => v !== '' && v !== 'null' && v !== 'undefined');
                
                if (fullUnique.length <= MAX_UNIQUE_VALUES) {
                     candidates.push({
                        col,
                        values: fullUnique.sort()
                     });
                }
            }
        });

        // Limit to top 5 most relevant looking filters to avoid clutter
        return candidates.slice(0, 5);
    }, [data]);

    const hasActiveFilters = Object.values(activeFilters).some((set: Set<string>) => set.size > 0);

    if (filterableColumns.length === 0) return null;

    return (
        <div className="mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center text-slate-900 font-semibold">
                    <Filter size={18} className="mr-2 text-primary-600" />
                    Filter Data
                </div>
                {hasActiveFilters && (
                    <button 
                        onClick={onClearFilters}
                        className="text-sm text-slate-500 hover:text-primary-600 flex items-center transition-colors"
                    >
                        <X size={14} className="mr-1" />
                        Clear all
                    </button>
                )}
            </div>
            <div className="p-4 flex flex-wrap gap-4">
                {filterableColumns.map((filter) => {
                    const activeSet = activeFilters[filter.col] || new Set();
                    const isActive = activeSet.size > 0;

                    return (
                        <div key={filter.col} className="relative group">
                            <details className="relative open:z-50">
                                <summary className={`list-none cursor-pointer px-4 py-2 rounded-lg border text-sm font-medium transition-all select-none flex items-center
                                    ${isActive 
                                        ? 'bg-primary-50 border-primary-200 text-primary-700' 
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}
                                `}>
                                    {filter.col}
                                    {isActive && (
                                        <span className="ml-2 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {activeSet.size}
                                        </span>
                                    )}
                                </summary>
                                <div className="absolute top-full left-0 mt-2 w-56 max-h-64 overflow-y-auto custom-scrollbar bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="space-y-1">
                                        {filter.values.map(value => {
                                            const isSelected = activeSet.has(value);
                                            return (
                                                <button
                                                    key={value}
                                                    onClick={() => onFilterChange(filter.col, value)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left
                                                        ${isSelected ? 'bg-primary-50 text-primary-900 font-medium' : 'text-slate-700 hover:bg-slate-50'}
                                                    `}
                                                >
                                                    <span className="truncate mr-2" title={value}>{value}</span>
                                                    {isSelected && <Check size={14} className="text-primary-600 flex-shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </details>
                            {/* Backdrop to close details when clicking outside - simple CSS trick */}
                            <div className="fixed inset-0 z-40 hidden group-open:block" onClick={(e) => {
                                const details = (e.target as HTMLElement).previousElementSibling as HTMLDetailsElement;
                                if (details) details.removeAttribute('open');
                            }}></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
