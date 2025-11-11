import React, { useState } from 'react';
import { DataRow } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  data: DataRow[];
}

const ROWS_PER_PAGE = 25;

export const DataTable: React.FC<Props> = ({ data }) => {
    const [page, setPage] = useState(0);
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    
    const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
    const startIdx = page * ROWS_PER_PAGE;
    const previewRows = data.slice(startIdx, startIdx + ROWS_PER_PAGE);

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900">Source Data</h3>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <span>
                        {startIdx + 1}-{Math.min(startIdx + ROWS_PER_PAGE, data.length)} of {data.length}
                    </span>
                    <div className="flex items-center space-x-1">
                        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-50">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-50">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
             <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            {headers.map((h) => <th key={h} className="px-4 py-2.5 font-medium text-slate-600 uppercase tracking-wider text-xs whitespace-nowrap">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {previewRows.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                {headers.map((h) => (
                                    <td key={`${i}-${h}`} className="px-4 py-3 text-slate-600 whitespace-nowrap max-w-xs truncate" title={String(row[h])}>
                                        {String(row[h] || '').trim() ? String(row[h]) : <em className="text-slate-400">null</em>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
