import React, { useState } from 'react';
import { DataRow, DataQualityReport } from '../types.ts';
import { Table, Play, ArrowLeft, CheckCircle2, AlertTriangle, Info, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';

interface Props {
    data: DataRow[];
    report: DataQualityReport | null;
    onConfirm: () => void;
    onCancel: () => void;
}

const ROWS_PER_PAGE = 8;

export const EmbeddedDataPreview: React.FC<Props> = ({ data, report, onConfirm, onCancel }) => {
    const [page, setPage] = useState(0);
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    
    const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
    const startIdx = page * ROWS_PER_PAGE;
    const previewRows = data.slice(startIdx, startIdx + ROWS_PER_PAGE);
    
    const isHighQuality = report ? report.score > 85 : true;

    return (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Confirm Your Data</h2>
                    <p className="text-slate-500 mt-1">Review the validation report and preview before generating the dashboard.</p>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center"
                    >
                        <RefreshCcw size={14} className="mr-2" />
                        Upload New File
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm flex items-center"
                    >
                        <Play size={16} className="mr-2 fill-current" />
                        Generate Dashboard
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                     {report && (
                        <div className={`p-6 rounded-2xl border ${isHighQuality ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-start mb-4">
                                {isHighQuality ? (
                                    <CheckCircle2 className="w-7 h-7 text-green-600 mr-3 flex-shrink-0" />
                                ) : (
                                    <AlertTriangle className="w-7 h-7 text-amber-600 mr-3 flex-shrink-0" />
                                )}
                                <div>
                                    <h3 className={`text-lg font-semibold ${isHighQuality ? 'text-green-900' : 'text-amber-900'}`}>
                                        {isHighQuality ? 'Data looks good!' : 'Issues Detected'}
                                    </h3>
                                    <p className={`text-sm ${isHighQuality ? 'text-green-700' : 'text-amber-700'}`}>
                                        Quality Score: <span className="font-bold">{report.score}/100</span>
                                    </p>
                                </div>
                            </div>

                            {report.issues.length > 0 && (
                                <ul className="space-y-3 mt-4">
                                    {report.issues.map((issue, idx) => (
                                        <li key={idx} className="flex items-start bg-white/60 p-3 rounded-lg">
                                            <Info className={`w-5 h-5 mr-2 flex-shrink-0 mt-0.5 ${issue.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                                            <div>
                                                <span className={`font-medium text-sm ${issue.severity === 'high' ? 'text-red-800' : 'text-amber-800'}`}>
                                                    {issue.title}
                                                </span>
                                                <p className={`text-xs ${issue.severity === 'high' ? 'text-red-600' : 'text-amber-700'}`}>
                                                    {issue.description}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                     <div className="bg-white p-5 rounded-2xl border border-slate-200">
                        <h4 className="font-semibold text-slate-900 mb-3 text-base flex items-center">
                            <Table className="w-5 h-5 mr-2 text-slate-500" />
                            Dataset Stats
                        </h4>
                        <dl className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <dt className="text-xs text-slate-500 uppercase font-medium">Rows</dt>
                                <dd className="text-xl font-semibold text-slate-900">{report?.rowCount.toLocaleString()}</dd>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <dt className="text-xs text-slate-500 uppercase font-medium">Columns</dt>
                                <dd className="text-xl font-semibold text-slate-900">{report?.columnCount.toLocaleString()}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
                     <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-900">Data Sample</h3>
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
                            <thead className="bg-slate-50 sticky top-0">
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
            </div>
        </div>
    );
};
