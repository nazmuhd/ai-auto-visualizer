
import React, { useState } from 'react';
import { DataRow, DataQualityReport } from '../types';
import { Table, Play, ArrowLeft, CheckCircle2, AlertTriangle, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    data: DataRow[];
    report: DataQualityReport | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DataPreview: React.FC<Props> = ({ data, report, onConfirm, onCancel }) => {
    const [page, setPage] = useState(0);
    const rowsPerPage = 10;
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    
    const totalPages = Math.ceil(data.length / rowsPerPage);
    const startIdx = page * rowsPerPage;
    const previewRows = data.slice(startIdx, startIdx + rowsPerPage);
    
    const isHighQuality = report ? report.score > 85 : true;

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-8 p-6 lg:p-8 overflow-hidden">
                
                {/* Left Sidebar: Validation Report */}
                <div className="w-full lg:w-1/3 flex-shrink-0 flex flex-col space-y-6 overflow-y-auto custom-scrollbar pr-2">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Data Validation</h1>
                        <p className="text-slate-600">Review the scan results before proceeding.</p>
                    </div>

                    {report && (
                        <div className={`p-6 rounded-2xl border ${isHighQuality ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                            <div className="flex items-center mb-4">
                                {isHighQuality ? (
                                    <CheckCircle2 className="w-8 h-8 text-green-600 mr-3 flex-shrink-0" />
                                ) : (
                                    <AlertTriangle className="w-8 h-8 text-amber-600 mr-3 flex-shrink-0" />
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

                            {report.issues.length === 0 ? (
                                <p className="text-green-800">
                                    No major issues found. Your dataset is clean and ready for visualization.
                                </p>
                            ) : (
                                <ul className="space-y-3 mt-4">
                                    {report.issues.map((issue, idx) => (
                                        <li key={idx} className="flex items-start bg-white/50 p-3 rounded-lg">
                                            <Info className={`w-5 h-5 mr-2 flex-shrink-0 mt-0.5 ${issue.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                                            <div>
                                                <span className={`font-medium ${issue.severity === 'high' ? 'text-red-900' : 'text-amber-900'}`}>
                                                    {issue.title}
                                                </span>
                                                <p className={`text-sm ${issue.severity === 'high' ? 'text-red-700' : 'text-amber-800'}`}>
                                                    {issue.description}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                            <Table className="w-5 h-5 mr-2 text-slate-500" />
                            Dataset Stats
                        </h4>
                        <dl className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <dt className="text-xs text-slate-500 uppercase">Rows</dt>
                                <dd className="text-lg font-semibold text-slate-900">{report?.rowCount.toLocaleString()}</dd>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <dt className="text-xs text-slate-500 uppercase">Columns</dt>
                                <dd className="text-lg font-semibold text-slate-900">{report?.columnCount.toLocaleString()}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="flex-1 hidden lg:block"></div> {/* Spacer */}

                     <div className="flex flex-col gap-3 pt-4 sticky bottom-0 bg-slate-50 lg:relative z-10">
                        <button
                            onClick={onConfirm}
                            className="w-full flex items-center justify-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-sm transition-colors text-lg"
                        >
                            <Play size={20} className="mr-2 fill-current" />
                            Generate Dashboard
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full flex items-center justify-center px-6 py-3 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                        >
                            <ArrowLeft size={18} className="mr-2" />
                            Upload Different File
                        </button>
                    </div>
                </div>

                {/* Right Side: Data Table Preview */}
                <div className="flex-1 flex flex-col min-h-[400px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-white sticky top-0 flex justify-between items-center z-20">
                        <h3 className="font-semibold text-slate-900">Data Preview</h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span>
                                Showing {startIdx + 1}-{Math.min(startIdx + rowsPerPage, data.length)} of {data.length}
                            </span>
                            <div className="flex items-center space-x-1">
                                <button 
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    {headers.map((header) => (
                                        <th key={header} className="px-4 py-3 font-semibold text-slate-900 uppercase tracking-wider text-xs whitespace-nowrap bg-slate-50 border-b border-slate-200">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {previewRows.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        {headers.map((header) => (
                                            <td key={`${i}-${header}`} className="px-4 py-3 text-slate-600 whitespace-nowrap max-w-xs truncate">
                                                {row[header] !== null && row[header] !== undefined && row[header] !== '' 
                                                    ? String(row[header]) 
                                                    : <em className="text-slate-300">null</em>}
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
