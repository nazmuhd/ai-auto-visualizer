import React, { memo } from 'react';
import { Filter, X } from 'lucide-react';

interface Props {
    filters: Record<string, Set<string>>;
    onRemove: (column: string, value?: string) => void;
}

export const FilterBar: React.FC<Props> = memo(({ filters, onRemove }) => {
    const filterEntries = Object.entries(filters).flatMap(([col, values]: [string, Set<string>]) => 
        Array.from(values).map(val => ({ col, val }))
    );

    if (filterEntries.length === 0) return null;

    return (
        <div className="mb-6 p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center flex-wrap gap-2">
            <div className="flex items-center text-sm font-semibold text-primary-800 mr-2">
                <Filter size={14} className="mr-2" /> Filters Applied:
            </div>
            {filterEntries.map(({ col, val }) => (
                <div key={`${col}-${val}`} className="flex items-center bg-white border border-primary-200 rounded-full px-2.5 py-1 text-sm text-primary-800 shadow-sm">
                    <span className="font-medium mr-1">{col}:</span>
                    <span className="max-w-[150px] truncate">{val}</span>
                    <button 
                        onClick={() => onRemove(col, val)} 
                        className="ml-2 text-primary-400 hover:text-primary-600 p-0.5 rounded-full hover:bg-primary-50 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
            <button 
                onClick={() => onRemove('__all__')} 
                className="ml-auto text-xs text-primary-600 hover:text-primary-800 hover:underline font-medium px-2"
            >
                Clear All
            </button>
        </div>
    );
});
