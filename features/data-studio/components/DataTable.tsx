
import React from 'react';
import { DataRow } from '../../../types.ts';
import { ArrowUp, ArrowDown, Filter as FilterIcon, MoreVertical } from 'lucide-react';

interface Props {
    headers: string[];
    data: DataRow[];
    sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
    filteredColumns: Set<string>;
    onSort: (key: string) => void;
    onMenuOpen: (e: React.MouseEvent, h: string) => void;
}

export const DataTable: React.FC<Props> = ({ headers, data, sortConfig, filteredColumns, onSort, onMenuOpen }) => (
    <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-auto custom-scrollbar">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>{headers.map(h => (<th key={h} className="px-4 py-2.5 font-medium text-slate-600 uppercase tracking-wider text-xs whitespace-nowrap group"><div className="flex items-center justify-between"><button onClick={() => onSort(h)} className="flex items-center w-full text-left">{h}{sortConfig?.key === h && (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-2" /> : <ArrowDown size={14} className="ml-2" />)}{filteredColumns.has(h) && <FilterIcon size={12} className="ml-2 text-primary-600" />}</button><button onClick={(e) => onMenuOpen(e, h)} className="ml-2 p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-slate-200"><MoreVertical size={14} /></button></div></th>))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">{data.map((row, i) => (<tr key={i} className="hover:bg-slate-50">{headers.map(h => (<td key={`${i}-${h}`} className="px-4 py-3 text-slate-600 whitespace-nowrap max-w-xs truncate" title={String(row[h])}>{String(row[h] ?? '').trim() ? String(row[h]) : <em className="text-slate-400">null</em>}</td>))}</tr>))}</tbody>
            </table>
        </div>
    </div>
);
