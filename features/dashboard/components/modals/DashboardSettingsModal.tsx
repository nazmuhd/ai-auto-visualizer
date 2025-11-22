
import React, { useState, useMemo } from 'react';
import { Project, KpiConfig, LayoutInfo } from '../../../../types.ts';
import { Settings, CheckCircle, Eye, EyeOff, GripVertical, PlusCircle, X, Zap } from 'lucide-react';

const DEFAULT_KPI: Omit<KpiConfig, 'id' | 'multiplier'> = { title: '', column: '', operation: 'sum', format: 'number', isCustom: true };

interface Props {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    dashboardLayout: string;
    onKpiVisibilityToggle: (kpiId: string) => void;
    onChartVisibilityToggle: (chartId: string) => void;
    onAddCustomKpi: (newKpi: Omit<KpiConfig, 'id'>) => void;
    layouts: LayoutInfo[];
}

export const DashboardSettingsModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    project, 
    dashboardLayout, 
    onKpiVisibilityToggle, 
    onChartVisibilityToggle, 
    onAddCustomKpi, 
    layouts
}) => {
    
    const [newKpi, setNewKpi] = useState<Omit<KpiConfig, 'id'>>(DEFAULT_KPI);
    const analysis = project.analysis;
    const columns = useMemo(() => project.dataSource.data.length > 0 ? Object.keys(project.dataSource.data[0]) : [], [project.dataSource.data]);

    if (!isOpen || !analysis) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewKpi(prev => ({ ...prev, [name]: value }));
    };

    const handleAddKpi = (e: React.FormEvent) => {
        e.preventDefault();
        if (newKpi.title && newKpi.column) {
            onAddCustomKpi(newKpi);
            setNewKpi(DEFAULT_KPI);
        }
    };
    
    const handleQuickAddTax = () => {
        const revenueColumn = columns.find(c => c.toLowerCase().includes('revenue')) 
                           || columns.find(c => c.toLowerCase().includes('sales'))
                           || columns[0];
        onAddCustomKpi({
            title: 'Sales Tax (8%)',
            column: revenueColumn,
            operation: 'sum',
            format: 'currency',
            isCustom: true,
            multiplier: 0.08
        });
    };

    const visibleCharts = analysis.charts.filter(c => c.visible);
    // Safe access to layouts to prevent "undefined (reading 'find')"
    const layout = (layouts && layouts.find(l => l.id === dashboardLayout)) || (layouts && layouts[0]) || { totalCharts: 6 };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-labelledby="edit-dashboard-title" className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-6 pb-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0 bg-white rounded-t-2xl">
                    <h3 id="edit-dashboard-title" className="text-xl font-bold text-slate-900 flex items-center"><Settings size={20} className="mr-3 text-primary-600" /> Dashboard Settings</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
                </header>

                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-8">
                    <section>
                        <h3 className="text-lg font-bold text-primary-900 mb-3 flex items-center"><Settings size={18} className="mr-2" /> Manage KPIs</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {analysis.kpis.map(kpi => (
                                <button key={kpi.id} onClick={() => onKpiVisibilityToggle(kpi.id)} className={`p-3 border rounded-lg text-left flex items-center justify-between w-full transition-all ${kpi.visible ? 'bg-white border-primary-300 ring-2 ring-primary-100' : 'bg-white/60 hover:bg-white border-slate-200 opacity-70 hover:opacity-100'}`}>
                                    <div><p className={`font-medium ${kpi.visible ? 'text-primary-800' : 'text-slate-800'}`}>{kpi.title}</p><p className={`text-xs ${kpi.visible ? 'text-primary-600' : 'text-slate-500'}`}> {kpi.operation.replace('_', ' ')} of "{kpi.column}"</p></div>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${kpi.visible ? 'bg-primary-600 border-primary-600' : 'border-slate-300'}`}>{kpi.visible && <CheckCircle className="w-4 h-4 text-white" />}</div>
                                </button>
                            ))}
                        </div>
                    </section>
                    
                     <section>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-bold text-primary-900 flex items-center"><PlusCircle size={18} className="mr-2" /> Add Custom KPI</h3>
                            <button onClick={handleQuickAddTax} className="px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-100 hover:bg-primary-200 rounded-full flex items-center"><Zap size={12} className="mr-1.5" /> Quick Add: Sales Tax (8%)</button>
                        </div>
                        <form onSubmit={handleAddKpi} className="p-4 bg-white rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-slate-600">Title</label>
                                <input name="title" value={newKpi.title} onChange={handleInputChange} type="text" placeholder="e.g., Average Order Value" className="w-full mt-1 px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Column</label>
                                <select name="column" value={newKpi.column} onChange={handleInputChange} className="w-full mt-1 px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required>
                                    <option value="">Select...</option>
                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600">Operation</label>
                                <select name="operation" value={newKpi.operation} onChange={handleInputChange} className="w-full mt-1 px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required>
                                    <option value="sum">Sum</option>
                                    <option value="average">Average</option>
                                    <option value="count_distinct">Count Distinct</option>
                                </select>
                            </div>
                            <button type="submit" className="md:col-span-1 w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center justify-center shadow-sm">Add KPI</button>
                        </form>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-primary-900 mb-3 flex items-center"><Settings size={18} className="mr-2" /> Manage Charts</h3>
                        <p className="text-sm text-primary-800/80 mb-3">You are showing <span className="font-bold">{visibleCharts.length}</span> of <span className="font-bold">{analysis.charts.length}</span> AI-generated charts. Your current layout supports up to <span className="font-bold">{layout.totalCharts}</span> charts.</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {analysis.charts.map(chart => (
                                <button key={chart.id} onClick={() => onChartVisibilityToggle(chart.id)} className={`p-3 border rounded-lg text-left w-full transition-all flex items-center gap-3 ${chart.visible ? 'bg-white border-primary-300 ring-2 ring-primary-100' : 'bg-white/60 hover:bg-white border-slate-200 opacity-70 hover:opacity-100'}`}>
                                    <GripVertical className="text-slate-300 flex-shrink-0 cursor-grab" size={16} />
                                    <div className="flex-1 truncate"><p className="font-medium text-slate-800 truncate">{chart.title}</p></div>
                                    {chart.visible ? <Eye size={16} className="text-primary-500 flex-shrink-0" /> : <EyeOff size={16} className="text-slate-400 flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
                
                <footer className="p-6 pt-4 border-t border-slate-200 flex justify-end flex-shrink-0 bg-white rounded-b-2xl">
                    <button onClick={onClose} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm">Done</button>
                </footer>
            </div>
        </div>
    );
};
