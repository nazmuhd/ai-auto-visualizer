import React, { useMemo, useState, useRef, useEffect, useCallback, memo, lazy, Suspense } from 'react';
import { AnalysisResult, DataRow, ChartConfig, LoadingState, DataQualityReport, Project, KpiConfig, LayoutInfo, SaveStatus, ReportLayoutItem, PresentationFormat, TextBlock, ReportTemplate, Presentation } from '../types.ts';
import { ChartRenderer, TimeFilterPreset } from './charts/ChartRenderer.tsx';
import { Download, Menu, FileText, BarChart3, Bot, UploadCloud, Edit3, Edit, LayoutGrid, PlusCircle, CheckCircle, Eye, EyeOff, GripVertical, Settings, Loader2, TrendingUp, TrendingDown, Minus, Filter, X, Save, MonitorPlay, Database, ChevronLeft, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { Sidebar } from './Sidebar.tsx';
import { GetStartedHub } from './GetStartedHub.tsx';
import { FileUploadContainer } from './FileUploadContainer.tsx';
import { TaskValidator } from './TaskValidator.tsx';
import { EmbeddedDataPreview } from './EmbeddedDataPreview.tsx';
import { CreateProjectModal } from './modals/CreateProjectModal.tsx';
import { SaveProjectModal } from './modals/SaveProjectModal.tsx';
import { RenameProjectModal } from './modals/RenameProjectModal.tsx';
import { DeleteConfirmationModal } from './modals/DeleteConfirmationModal.tsx';
import { ChartMaximizeModal } from './modals/ChartMaximizeModal.tsx';
import { LayoutSelectionModal } from './modals/LayoutSelectionModal.tsx';
import { DashboardSettingsModal } from './modals/DashboardSettingsModal.tsx';
import { KpiDetailModal } from './modals/KpiDetailModal.tsx';
import { ReportTemplateSelectionModal } from './modals/ReportTemplateSelectionModal.tsx';
import { processFile } from '../services/dataParser.ts';
import { analyzeData, generateInitialPresentation } from '../services/geminiService.ts';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';

const ReportStudio = lazy(() => import('./AIReportView.tsx').then(m => ({ default: m.ReportStudio })));
const DataStudio = lazy(() => import('./DataStudio.tsx').then(m => ({ default: m.DataStudio })));
const PresentationView = lazy(() => import('./PresentationView.tsx').then(m => ({ default: m.PresentationView })));


interface DashboardProps {
    userEmail: string;
    onLogout: () => void;
}

const layouts: LayoutInfo[] = [
  { id: '2-2-2', name: 'Consulting Standard', rows: [2, 2, 2], totalCharts: 6, description: 'A balanced view, ideal for standard executive reporting.', usedBy: 'McKinsey, BCG, Bain' },
  { id: '3-3', name: 'Compact Grid', rows: [3, 3], totalCharts: 6, description: 'High-density for comparing multiple metrics side-by-side.', usedBy: 'Deloitte, Accenture, PwC' },
  { id: '1-2-2', name: 'Story Mode', rows: [1, 2, 2], totalCharts: 5, description: 'Guides a narrative, starting with a key summary chart.', usedBy: 'McKinsey, Bain' },
  { id: '2-3-2', name: 'Pyramid Layout', rows: [2, 3, 2], totalCharts: 7, description: 'Flexible layout that highlights a central row of key charts.', usedBy: 'BCG, Bain' },
  { id: '3-4', name: 'High-Density', rows: [3, 4], totalCharts: 7, description: 'Maximizes information for complex, data-rich dashboards.', usedBy: 'Accenture, Deloitte' },
];

const useResponsiveSidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start collapsed by default

    useEffect(() => {
        const handleResize = () => {
            // Automatically close if the screen becomes very small (mobile view)
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return [isSidebarOpen, setIsSidebarOpen] as const;
};

const structureChartsByLayout = (charts: ChartConfig[], layoutId: string): ChartConfig[][] => {
    if (!charts || charts.length === 0) return [];
    
    const layout = layouts.find(l => l.id === layoutId) || layouts[0];
    const layoutRows = layout.rows;
    
    const structuredCharts: ChartConfig[][] = [];
    let chartIndex = 0;

    for (const rowSize of layoutRows) {
        if (chartIndex >= charts.length) break;
        const rowCharts = charts.slice(chartIndex, chartIndex + rowSize);
        structuredCharts.push(rowCharts);
        chartIndex += rowSize;
    }

    return structuredCharts;
};

const KpiCard: React.FC<{
    kpi: KpiConfig;
    value: number | null;
    trend: number | null;
    sparklineData: { name: string; value: number }[];
    onClick: () => void;
}> = memo(({ kpi, value, trend, sparklineData, onClick }) => {
    
    const trendColor = trend === null ? 'slate' : trend > 0 ? (kpi.trendDirection === 'higher-is-better' ? 'green' : 'red') : trend < 0 ? (kpi.trendDirection === 'higher-is-better' ? 'red' : 'green') : 'slate';
    const TrendIcon = trend === null ? Minus : trend > 0 ? TrendingUp : TrendingDown;
    const formattedValue = new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(value ?? 0);

    return (
        <div onClick={onClick} className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden group hover:shadow-lg hover:-translate-y-1 hover:border-primary-300 ${trendColor === 'green' ? 'bg-green-50/40 border-green-200/60' : trendColor === 'red' ? 'bg-red-50/40 border-red-200/60' : 'bg-white border-slate-200/80 shadow-sm'}`}>
            <p className="text-sm font-medium text-slate-500 mb-1 truncate">{kpi.title}</p>
            <p className="text-3xl font-bold text-slate-900">{formattedValue}</p>
            {trend !== null && (
                 <div className={`mt-1 flex items-center text-sm font-semibold text-${trendColor}-600`}>
                    <TrendIcon size={16} className="mr-1"/>
                    <span>{trend.toFixed(1)}%</span>
                    <span className="text-xs text-slate-400 font-normal ml-1.5">vs last period</span>
                </div>
            )}
             {sparklineData.length > 1 && (
                <div className="absolute bottom-0 right-0 h-1/2 w-2/3 opacity-30 group-hover:opacity-60 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                            <Line type="monotone" dataKey="value" stroke={trendColor === 'green' ? '#10b981' : trendColor === 'red' ? '#ef4444' : '#64748b'} strokeWidth={2} dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
});

const KpiSection: React.FC<{ kpis: KpiConfig[], data: DataRow[], dateColumn: string | null, onKpiClick: (kpi: KpiConfig) => void }> = memo(({ kpis, data, dateColumn, onKpiClick }) => {
    const kpiValues = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        let historicalData: Record<string, DataRow[]> = {};
        if (dateColumn) {
             const sortedData = [...data].sort((a,b) => new Date(a[dateColumn]).getTime() - new Date(b[dateColumn]).getTime());
             sortedData.forEach(row => {
                try {
                    const date = new Date(row[dateColumn]);
                    if(isNaN(date.getTime())) return;
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if(!historicalData[monthKey]) historicalData[monthKey] = [];
                    historicalData[monthKey].push(row);
                } catch(e) {}
             });
        }
        const periods = Object.keys(historicalData).sort();
        const lastPeriodKey = periods[periods.length - 1];
        const prevPeriodKey = periods[periods.length - 2];

        return kpis.map(kpi => {
            const calculateValue = (dataset: DataRow[]) => {
                if(!dataset || dataset.length === 0) return 0;
                let filteredData = dataset;
                if(kpi.primaryCategory && kpi.primaryCategoryValue) {
                    filteredData = dataset.filter(r => String(r[kpi.primaryCategory!]) === kpi.primaryCategoryValue);
                }
                
                let baseValue = 0;
                if(kpi.operation === 'sum') baseValue = filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0);
                else if(kpi.operation === 'average') baseValue = filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0) / (filteredData.length || 1);
                else if (kpi.operation === 'count_distinct') {
                    const values = filteredData.map(row => row[kpi.column]);
                    baseValue = new Set(values).size;
                }
                
                return baseValue * (kpi.multiplier || 1);
            };

            const currentValue = calculateValue(data);
            let trend: number | null = null;
            if(lastPeriodKey && prevPeriodKey) {
                const lastPeriodValue = calculateValue(historicalData[lastPeriodKey]);
                const prevPeriodValue = calculateValue(historicalData[prevPeriodKey]);
                if(prevPeriodValue !== 0) {
                    trend = ((lastPeriodValue - prevPeriodValue) / prevPeriodValue) * 100;
                }
            }

            const sparklineData = periods.slice(-12).map(p => ({name: p, value: calculateValue(historicalData[p])}));
            
            return { ...kpi, displayValue: currentValue, trend, sparklineData };
        });
    }, [kpis, data, dateColumn]);

    if (kpiValues.length === 0) return null;
    return (
        <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Key Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {kpiValues.map(kpi => <KpiCard key={kpi.id} kpi={kpi} value={kpi.displayValue} trend={kpi.trend} sparklineData={kpi.sparklineData} onClick={() => onKpiClick(kpi)} />)}
            </div>
        </section>
    );
});

const DashboardView: React.FC<{
    chartRows: ChartConfig[][];
    getGridColsClass: (count: number) => string;
    dataSource: { data: DataRow[] };
    allData: DataRow[];
    dateColumn: string | null;
    onChartUpdate: (updatedChart: ChartConfig) => void;
    onSetMaximizedChart: (chart: ChartConfig | null) => void;
    onGlobalFilterChange: (column: string, values: Set<string>) => void;
    onTimeFilterChange: (filter: { type: TimeFilterPreset; start?: string; end?: string }) => void;
    globalFilters: Record<string, Set<string>>;
    timeFilter: { type: TimeFilterPreset; start?: string; end?: string };
}> = memo(({ chartRows, getGridColsClass, dataSource, allData, dateColumn, onChartUpdate, onSetMaximizedChart, onGlobalFilterChange, onTimeFilterChange, globalFilters, timeFilter }) => (
    <section>
        {chartRows.map((row, rowIndex) => (
            <div key={rowIndex} className={`grid grid-cols-1 ${getGridColsClass(row.length)} gap-6 lg:gap-8 mb-6 lg:mb-8`}>
                {row.map(chart => (
                    <div key={chart.id} className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px]">
                        <ChartRenderer config={chart} data={dataSource.data} allData={allData} dateColumn={dateColumn} onUpdate={onChartUpdate} onMaximize={onSetMaximizedChart} enableScrollZoom={true} onFilterChange={onGlobalFilterChange} onTimeFilterChange={onTimeFilterChange} activeFilters={globalFilters} activeTimeFilter={timeFilter}/>
                    </div>
                ))}
            </div>
        ))}
    </section>
));

const ProjectSetup: React.FC<{ project: Project; onFileSelect: (file: File) => void; onRename: () => void }> = ({ project, onFileSelect, onRename }) => (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center gap-4 mb-6">
            <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-slate-900 truncate">{project.name}</h2>
                <p className="text-sm text-slate-500 truncate">{project.description || "No description provided."}</p>
            </div>
            <div className="flex-shrink-0">
                <button onClick={onRename} className="p-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center"><Edit3 size={16} /></button>
            </div>
        </div>
        <div className="p-8 bg-white rounded-2xl border-2 border-dashed border-slate-300 text-center">
            <div className="p-3 bg-primary-100 text-primary-600 rounded-full mb-4 inline-block"><UploadCloud size={32} /></div>
            <h3 className="text-xl font-semibold text-slate-900 mb-1">Add a Data Source</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">To get started, please upload the data file for your project "{project.name}".</p>
            <FileUploadContainer onFileSelect={onFileSelect} />
        </div>
    </div>
);

const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    switch (status) {
        case 'unsaved':
            return <div className="flex items-center text-sm font-semibold text-amber-700"><div className="w-3 h-3 rounded-full bg-amber-500 mr-2 animate-pulse"></div>Unsaved Changes</div>;
        case 'saving':
            return <div className="flex items-center text-xs text-slate-500"><Loader2 size={12} className="mr-2 animate-spin" /> Saving...</div>;
        case 'saved':
            return <div className="flex items-center text-xs text-green-600"><CheckCircle size={12} className="mr-2" /> All changes saved</div>;
        default:
            return <div className="h-5" />; // Placeholder for alignment
    }
};

const GlobalFilterBar: React.FC<{ filters: Record<string, Set<string>>, onRemove: (column: string, value?: string) => void }> = memo(({ filters, onRemove }) => {
    // FIX: Explicitly type `values` to ensure it is treated as a Set, resolving potential type inference issues.
    const filterEntries = Object.entries(filters).flatMap(([col, values]: [string, Set<string>]) => Array.from(values).map(val => ({ col, val })));
    if (filterEntries.length === 0) return null;

    return (
        <div className="mb-6 p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center flex-wrap gap-2">
            <div className="flex items-center text-sm font-semibold text-primary-800 mr-2"><Filter size={14} className="mr-2" /> Filters Applied:</div>
            {filterEntries.map(({ col, val }) => (
                <div key={`${col}-${val}`} className="flex items-center bg-white border border-primary-200 rounded-full px-2.5 py-1 text-sm text-primary-800">
                    <span className="font-medium mr-1">{col}:</span>
                    <span>{val}</span>
                    <button onClick={() => onRemove(col, val)} className="ml-2 text-primary-400 hover:text-primary-600"><X size={14} /></button>
                </div>
            ))}
            <button onClick={() => onRemove('__all__')} className="ml-auto text-xs text-primary-600 hover:underline">Clear All</button>
        </div>
    );
});

const ReportHub: React.FC<{ 
    project: Project,
    onCreateReport: () => void,
    onSelectPresentation: (id: string) => void 
}> = ({ project, onCreateReport, onSelectPresentation }) => {
    const presentations = project.presentations || [];
    
    if (presentations.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="p-4 bg-primary-100 text-primary-600 rounded-full mb-6 inline-block"><Bot size={40} /></div>
                <h2 className="text-3xl font-bold text-slate-900">Create your report instantly</h2>
                <p className="text-lg text-slate-500 mt-2 mb-10">Let AI help you build a professional presentation from your dashboard.</p>
                <button 
                    onClick={onCreateReport} 
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center mx-auto"
                >
                    <PlusCircle size={20} className="mr-2" />
                    Create a Presentation
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Report Studio Hub</h2>
                 <button 
                    onClick={onCreateReport} 
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-transform transform hover:scale-105 flex items-center"
                >
                    <PlusCircle size={16} className="mr-2" />
                    Create New Presentation
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {presentations.map(p => (
                    <button key={p.id} onClick={() => onSelectPresentation(p.id)} className="group text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-primary-500 hover:shadow-xl transition-all transform hover:-translate-y-1 bg-white">
                        <div className="aspect-video w-full rounded-lg bg-slate-100 border border-slate-200 group-hover:bg-primary-50/50 flex items-center justify-center">
                            <FileText size={40} className="text-slate-400 group-hover:text-primary-500" />
                        </div>
                        <h3 className="font-bold text-slate-800 mt-3 truncate">{p.name}</h3>
                        <p className="text-sm text-slate-500">{p.slides.length} {p.format === 'slides' ? 'Slides' : 'Pages'}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};


const ProjectWorkspace: React.FC<{
    project: Project;
    filteredData: DataRow[];
    onOpenEditModal: () => void;
    setIsLayoutModalOpen: (isOpen: boolean) => void;
    onCreateReport: () => void;
    onSelectPresentation: (id: string) => void;
    dashboardLayout: string;
    dateColumn: string | null;
    onChartUpdate: (updatedChart: ChartConfig) => void;
    onSetMaximizedChart: (chart: ChartConfig | null) => void;
    saveStatus: SaveStatus;
    onManualSave: () => void;
    globalFilters: Record<string, Set<string>>;
    timeFilter: { type: TimeFilterPreset; start?: string; end?: string };
    onGlobalFilterChange: (column: string, values: Set<string>) => void;
    onTimeFilterChange: (filter: { type: TimeFilterPreset; start?: string; end?: string }) => void;
    onRemoveFilter: (column: string, value?: string) => void;
    onKpiClick: (kpi: KpiConfig) => void;
    onProjectUpdate: (updater: (prev: Project) => Project) => void;
    editingPresentationId: string | null;
    onBackToHub: () => void;
    onPresentationUpdate: (updatedPresentation: Presentation) => void;
    onPresent: (id: string) => void;
}> = ({ 
    project, filteredData, onOpenEditModal, setIsLayoutModalOpen, onCreateReport, onSelectPresentation, 
    saveStatus, onManualSave, globalFilters, timeFilter, onGlobalFilterChange, onTimeFilterChange, onRemoveFilter, 
    onKpiClick, onProjectUpdate, editingPresentationId, onBackToHub, onPresentationUpdate, onPresent, ...props 
}) => {
    
    const [currentView, setCurrentView] = useState<'dashboard' | 'report-studio' | 'data'>('dashboard');
    const { analysis } = project;
    
    useEffect(() => {
        if (editingPresentationId) {
            setCurrentView('report-studio');
        }
    }, [editingPresentationId]);

    if (!analysis) return null;

    const TabButton = ({ view, label, icon: Icon }: { view: 'dashboard' | 'report-studio' | 'data', label: string, icon: React.ElementType }) => (<button onClick={() => { setCurrentView(view); onBackToHub(); }} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors ${currentView === view ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}><Icon size={16} className="mr-2"/>{label}</button>);
    const visibleCharts = analysis.charts.filter(c => c.visible);
    const chartRows = structureChartsByLayout(visibleCharts, props.dashboardLayout);
    const getGridColsClass = (count: number) => {
        switch(count) {
            case 1: return 'lg:grid-cols-1';
            case 2: return 'lg:grid-cols-2';
            case 3: return 'lg:grid-cols-3';
            case 4: return 'lg:grid-cols-4';
            default: return 'lg:grid-cols-1';
        }
    };
    
    const formatDate = (date: Date | undefined): string => {
        if (!date) return '';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(date);
    };

    const visibleKpis = useMemo(() => analysis.kpis.filter(kpi => kpi.visible), [analysis.kpis]);
    const ViewLoader = () => <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
    
    const presentationToEdit = project.presentations?.find(p => p.id === editingPresentationId);
    const isReportStudioMode = currentView === 'report-studio' && !!editingPresentationId;

    return (
        <div className={`w-full duration-300 ${isReportStudioMode ? 'h-full flex flex-col' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
            {!isReportStudioMode && (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold text-slate-900 truncate">{project.name}</h2>
                            <p className="text-sm text-slate-500 mt-1 truncate">{project.description || "No description provided."}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center space-x-3">
                            <div className="text-right">
                                <SaveStatusIndicator status={saveStatus} />
                                {saveStatus !== 'unsaved' && saveStatus !== 'saving' && project.lastSaved && (
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Last saved: {formatDate(project.lastSaved)}
                                    </p>
                                )}
                            </div>
                            <button onClick={onManualSave} className={`px-4 py-2 text-sm font-medium border rounded-lg flex items-center transition-all duration-300 shadow-sm ${saveStatus === 'unsaved' ? 'text-white bg-primary-600 border-primary-600 hover:bg-primary-700' : 'w-0 p-0 opacity-0 -mr-3 border-transparent'}`}>
                                <Save size={16} className="mr-2" /> Save
                            </button>
                            {saveStatus === 'saving' && (
                                <button disabled className="px-4 py-2 text-sm font-medium border rounded-lg flex items-center transition-colors text-slate-500 bg-slate-200 border-slate-300 cursor-not-allowed">
                                    <Loader2 size={16} className="mr-2 animate-spin" /> Saving...
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                        <div className="p-1.5 bg-slate-100 rounded-lg inline-flex items-center space-x-1 border border-slate-200"><TabButton view="dashboard" label="Dashboard" icon={BarChart3} /><TabButton view="report-studio" label="Report Studio" icon={Bot}/><TabButton view="data" label="Data Studio" icon={Database} /></div>
                        <div className="flex items-center space-x-2 w-full justify-end sm:w-auto">
                            {currentView === 'dashboard' && (
                                <>
                                <button onClick={onOpenEditModal} className="px-4 py-2 text-sm font-medium border rounded-lg flex items-center transition-colors text-slate-700 bg-white border-slate-300 hover:bg-slate-50">
                                        <Edit size={16} className="mr-2" /> Edit
                                    </button>
                                    <button onClick={() => setIsLayoutModalOpen(true)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center">
                                        <LayoutGrid size={16} className="mr-2" /> Layout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            <div className={isReportStudioMode ? 'flex-1 min-h-0' : ''}>
                {currentView === 'dashboard' && (
                <div className="w-full h-full overflow-y-auto custom-scrollbar">
                    <GlobalFilterBar filters={globalFilters} onRemove={onRemoveFilter} />
                    <KpiSection kpis={visibleKpis} data={project.dataSource.data} dateColumn={props.dateColumn} onKpiClick={onKpiClick} />
                    <DashboardView chartRows={chartRows} getGridColsClass={getGridColsClass} dataSource={{data: filteredData}} allData={project.dataSource.data} dateColumn={props.dateColumn} onChartUpdate={props.onChartUpdate} onSetMaximizedChart={props.onSetMaximizedChart} onGlobalFilterChange={onGlobalFilterChange} onTimeFilterChange={onTimeFilterChange} globalFilters={globalFilters} timeFilter={timeFilter} />
                </div>
                )}
                {currentView === 'report-studio' && !editingPresentationId && <ReportHub project={project} onCreateReport={onCreateReport} onSelectPresentation={onSelectPresentation} />}
                {currentView === 'report-studio' && editingPresentationId && presentationToEdit && (
                    <Suspense fallback={<ViewLoader />}>
                        <ReportStudio 
                            project={project}
                            presentation={presentationToEdit}
                            onPresentationUpdate={onPresentationUpdate}
                            onBackToHub={onBackToHub}
                            onPresent={onPresent}
                        />
                    </Suspense>
                )}
                {currentView === 'data' && <div className="h-full"><Suspense fallback={<ViewLoader />}><DataStudio project={project} onProjectUpdate={onProjectUpdate} /></Suspense></div>}
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ userEmail, onLogout }) => {
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [status, setStatus] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [validationReport, setValidationReport] = useState<DataQualityReport | null>(null);
    const [progress, setProgress] = useState<{ status: string, percentage: number } | null>(null);
    const [savedProjects, setSavedProjects] = useState<Project[]>([]);
    
    const [isSidebarOpen, setIsSidebarOpen] = useResponsiveSidebar();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToManage, setProjectToManage] = useState<Project | null>(null);
    
    const [editingPresentationId, setEditingPresentationId] = useState<string | null>(null);
    const [presentingPresentationId, setPresentingPresentationId] = useState<string | null>(null);

    const [maximizedChart, setMaximizedChart] = useState<ChartConfig | null>(null);
    const [selectedKpi, setSelectedKpi] = useState<KpiConfig | null>(null);
    const [dashboardLayout, setDashboardLayout] = useState<string>('2-2-2');
    const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [isReportTemplateModalOpen, setIsReportTemplateModalOpen] = useState(false);
    
    const [globalFilters, setGlobalFilters] = useState<Record<string, Set<string>>>({});
    const [timeFilter, setTimeFilter] = useState<{ type: TimeFilterPreset; start?: string; end?: string }>({ type: 'all' });

    const [mainView, setMainView] = useState<'dashboard' | 'settings' | 'account'>('dashboard');

    const analysisPromiseRef = useRef<Promise<AnalysisResult> | null>(null);
    const mainContentRef = useRef<HTMLElement>(null);
    const saveStatusTimeoutRef = useRef<number | null>(null);

    // Load projects from local storage on initial mount
    useEffect(() => {
        try {
            const storedProjects = localStorage.getItem('ai-insights-projects');
            if (storedProjects) {
                 const projects: Project[] = JSON.parse(storedProjects, (key, value) => {
                    if ((key === 'createdAt' || key === 'lastSaved') && typeof value === 'string') {
                        return new Date(value);
                    }
                    return value;
                });
                setSavedProjects(projects);
            }
        } catch (e) {
            console.error("Failed to load projects from local storage", e);
        }
    }, []);

    const saveProjectsToLocalStorage = (projects: Project[]) => {
        try {
            localStorage.setItem('ai-insights-projects', JSON.stringify(projects));
        } catch (e) {
            console.error("Failed to save projects to local storage", e);
        }
    };
    
    const updateActiveProject = useCallback((updater: (prev: Project) => Project) => {
        setActiveProject(prev => {
            if (!prev) return null;
            const updatedProject = updater(prev);
            if (!prev.id.startsWith('unsaved_')) {
                setSaveStatus('unsaved');
            }
            return updatedProject;
        });
    }, []);
    
    const handleManualSave = useCallback(() => {
        if (!activeProject || saveStatus !== 'unsaved') return;
        setSaveStatus('saving');

        const projectToSave = { ...activeProject, lastSaved: new Date() };
        setActiveProject(projectToSave);

        const updatedProjects = savedProjects.map(p => p.id === projectToSave.id ? projectToSave : p);
        saveProjectsToLocalStorage(updatedProjects);
        setSavedProjects(updatedProjects);

        setTimeout(() => {
            setSaveStatus('saved');
            if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current);
            saveStatusTimeoutRef.current = window.setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    }, [activeProject, saveStatus, savedProjects]);


    const dateColumn = useMemo(() => {
        const data = activeProject?.dataSource.data;
        if (!data || data.length < 5) return null;
        const columns = Object.keys(data[0]);
        return columns.find(col => !isNaN(Date.parse(String(data[4]?.[col])))) || null;
    }, [activeProject]);

    const filteredData = useMemo(() => {
        if (!activeProject) return [];
        let result = activeProject.dataSource.data;

        if (dateColumn && timeFilter.type !== 'all') {
            const now = new Date();
            let startDate: Date | null = null;
            let endDate: Date | null = new Date(); 

            switch (timeFilter.type) {
                case '7d': startDate = new Date(); startDate.setDate(now.getDate() - 7); break;
                case '30d': startDate = new Date(); startDate.setDate(now.getDate() - 30); break;
                case '90d': startDate = new Date(); startDate.setDate(now.getDate() - 90); break;
                case 'ytd': startDate = new Date(now.getFullYear(), 0, 1); break;
                case 'custom':
                    endDate = null;
                    if (timeFilter.start) startDate = new Date(timeFilter.start + 'T00:00:00');
                    if (timeFilter.end) endDate = new Date(timeFilter.end + 'T23:59:59');
                    break;
            }

            result = result.filter(row => {
                const rowDateValue = row[dateColumn!];
                if (!rowDateValue) return false;
                const rowDate = new Date(rowDateValue);
                if (isNaN(rowDate.getTime())) return false;
                if (startDate && rowDate < startDate) return false;
                if (endDate && rowDate > endDate) return false;
                return true;
            });
        }
        
        // FIX: Explicitly type `allowedValues` to ensure it is treated as a Set, resolving potential type inference issues.
        Object.entries(globalFilters).forEach(([col, allowedValues]: [string, Set<string>]) => {
            if (allowedValues.size > 0) {
                result = result.filter(row => allowedValues.has(String(row[col])));
            }
        });
        
        return result;

    }, [activeProject, globalFilters, timeFilter, dateColumn]);


    const handleFileSelect = useCallback(async (file: File) => {
        let projectToUpdate = activeProject;
        
        if (projectToUpdate && projectToUpdate.dataSource.data.length === 0) {
            setActiveProject(p => p ? { ...p, dataSource: { ...p.dataSource, name: file.name } } : null);
        } else {
            projectToUpdate = {
                id: `unsaved_${Date.now()}`, name: file.name, description: '', createdAt: new Date(),
                dataSource: { name: file.name, data: [] }, analysis: null,
            };
            setActiveProject(projectToUpdate);
        }

        setStatus('parsing');
        setError(null);
        setEditingPresentationId(null);
        setPresentingPresentationId(null);
        setGlobalFilters({});
        setTimeFilter({ type: 'all' });
        setProgress({ status: 'Initiating upload...', percentage: 0 });

        try {
            const result = await processFile(file, (status, percentage) => {
                setProgress({ status, percentage });
            });
            
            setActiveProject(p => p ? { ...p, dataSource: { ...p.dataSource, data: result.data } } : null);
            setValidationReport(result.report);
            setStatus('validating_tasks'); 
            analysisPromiseRef.current = analyzeData(result.sample);
            
        } catch (err: any) {
            setError(err.message || "Error processing file.");
            setStatus('error');
            setActiveProject(null);
            setProgress(null);
        }
    }, [activeProject]);

    const handleValidationComplete = useCallback(() => setStatus('validated'), []);

    const handleConfirmPreview = useCallback(async () => {
        if (!activeProject) return;
        setStatus('analyzing');
        setProgress({ status: 'AI is generating insights...', percentage: 50 });
        try {
            const result = await analysisPromiseRef.current!;
            const layoutDef = layouts.find(l => l.id === dashboardLayout) || layouts[0];
            const maxCharts = layoutDef.totalCharts;

            const chartsWithVisibility: ChartConfig[] = result.charts.map((chart, index) => ({
                ...chart,
                visible: index < maxCharts,
            }));

            const initialKpis = result.kpis.map((kpi, index) => ({
                 ...kpi,
                 visible: index < 5
            }));
            
            const projectWithAnalysis = { ...activeProject, analysis: { ...result, charts: chartsWithVisibility, kpis: initialKpis } };

            setActiveProject(projectWithAnalysis);
            
            if (projectWithAnalysis.id.startsWith('unsaved_')) {
                 setIsSaveModalOpen(true);
            }

            setStatus('complete');
        } catch (err: any) {
             setError(err.message || "Failed to analyze data.");
             setStatus('error');
        } finally {
            analysisPromiseRef.current = null;
            setProgress(null);
        }
    }, [activeProject, dashboardLayout]);

    const handleReset = useCallback(() => {
        setActiveProject(null);
        setStatus('idle');
        setError(null);
        setEditingPresentationId(null);
        setPresentingPresentationId(null);
        setGlobalFilters({});
        setTimeFilter({type:'all'});
        setProgress(null);
        setIsSettingsModalOpen(false);
        setMainView('dashboard');
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
    }, [setIsSidebarOpen]);
    
    const handleCreateProject = useCallback((name: string, description: string) => {
        const newProject: Project = {
            id: new Date().toISOString(), name, description, createdAt: new Date(), lastSaved: new Date(),
            dataSource: { name: 'No data source', data: [] }, analysis: null,
        };
        const updatedProjects = [newProject, ...savedProjects];
        setSavedProjects(updatedProjects);
        saveProjectsToLocalStorage(updatedProjects);
        setActiveProject(newProject);
        setIsCreateModalOpen(false);
        setMainView('dashboard');
    }, [savedProjects]);

    const handleSaveProject = useCallback((name: string, description: string) => {
        if (!activeProject) return;
        const finalId = new Date().toISOString();
        const finalProject: Project = { ...activeProject, id: finalId, name, description, createdAt: new Date(), lastSaved: new Date() };

        const updatedProjects = [finalProject, ...savedProjects];
        setSavedProjects(updatedProjects);
        saveProjectsToLocalStorage(updatedProjects);
        
        setActiveProject(finalProject);
        setIsSaveModalOpen(false);
        setSaveStatus('saved');
        if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current);
        saveStatusTimeoutRef.current = window.setTimeout(() => setSaveStatus('idle'), 2000);

    }, [activeProject, savedProjects]);

    const handleSelectProject = useCallback((projectId: string) => {
        const project = savedProjects.find(p => p.id === projectId);
        if (project) {
            setActiveProject(project);
            setStatus(project.dataSource.data.length > 0 ? 'complete' : 'idle');
            setEditingPresentationId(null);
            setPresentingPresentationId(null);
            setGlobalFilters({});
            setTimeFilter({ type: 'all' });
            setIsSettingsModalOpen(false);
            setSaveStatus('idle');
            setMainView('dashboard');
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
            mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [savedProjects, setIsSidebarOpen]);

    const handleOpenRenameModal = useCallback((project: Project) => { setProjectToManage(project); setIsRenameModalOpen(true); }, []);
    
    const handleRenameProject = useCallback((name: string, description: string) => {
        if (!projectToManage) return;
        const updatedProject = { ...projectToManage, name, description, lastSaved: new Date() };
        const updatedProjects = savedProjects.map(p => p.id === projectToManage.id ? updatedProject : p);
        setSavedProjects(updatedProjects);
        saveProjectsToLocalStorage(updatedProjects);
        if (activeProject?.id === projectToManage.id) setActiveProject(updatedProject);
    }, [projectToManage, savedProjects, activeProject]);

    const handleOpenDeleteModal = useCallback((project: Project) => { setProjectToManage(project); setIsDeleteModalOpen(true); }, []);
    
    const handleDeleteProject = useCallback(() => {
        if (!projectToManage) return;
        const updatedProjects = savedProjects.filter(p => p.id !== projectToManage.id);
        setSavedProjects(updatedProjects);
        saveProjectsToLocalStorage(updatedProjects);
        if (activeProject?.id === projectToManage.id) handleReset();
    }, [projectToManage, savedProjects, activeProject, handleReset]);
    
    const handleChartUpdate = useCallback((updatedChart: ChartConfig) => {
        updateActiveProject(p => {
            if (!p.analysis) return p;
            const updatedAnalysis = {
                ...p.analysis,
                charts: p.analysis.charts.map(c => c.id === updatedChart.id ? updatedChart : c)
            };
            if (maximizedChart && maximizedChart.id === updatedChart.id) {
                setMaximizedChart(updatedChart);
            }
            return { ...p, analysis: updatedAnalysis };
        });
    }, [maximizedChart, updateActiveProject]);

    const handleSelectLayout = useCallback((layoutId: string) => {
        setDashboardLayout(layoutId);
        setIsLayoutModalOpen(false);
        updateActiveProject(p => {
            if (!p.analysis) return p;
            const newLayout = layouts.find(l => l.id === layoutId) || layouts[0];
            const maxCharts = newLayout.totalCharts;
            let visibleCount = 0;
            const updatedCharts = p.analysis.charts.map(chart => {
                const shouldBeVisible = chart.visible && visibleCount < maxCharts;
                if (shouldBeVisible) visibleCount++;
                return { ...chart, visible: shouldBeVisible };
            });
            if (visibleCount < maxCharts) {
                for (let chart of updatedCharts) {
                    if (visibleCount >= maxCharts) break;
                    if (!chart.visible) {
                        chart.visible = true;
                        visibleCount++;
                    }
                }
            }
            return { ...p, analysis: { ...p.analysis, charts: updatedCharts } };
        });
    }, [updateActiveProject]);
    
    const handleKpiVisibilityToggle = useCallback((kpiId: string) => {
        updateActiveProject(p => {
            if (!p.analysis) return p;
            const updatedKpis = p.analysis.kpis.map(kpi => kpi.id === kpiId ? { ...kpi, visible: !kpi.visible } : kpi);
            return { ...p, analysis: { ...p.analysis, kpis: updatedKpis } };
        });
    }, [updateActiveProject]);

    const handleAddCustomKpi = useCallback((newKpi: Omit<KpiConfig, 'id'>) => {
        updateActiveProject(p => {
            if (!p.analysis) return p;
            const fullNewKpi = { ...newKpi, id: `custom_${Date.now()}`, visible: true };
            const updatedKpis = [...p.analysis.kpis, fullNewKpi];
            return { ...p, analysis: { ...p.analysis, kpis: updatedKpis } };
        });
    }, [updateActiveProject]);
    
    const handleChartVisibilityToggle = useCallback((chartId: string) => {
        if (!activeProject?.analysis) return;
        const targetChart = activeProject.analysis.charts.find(c => c.id === chartId);
        if (!targetChart) return;

        const layout = layouts.find(l => l.id === dashboardLayout) || layouts[0];
        const maxCharts = layout.totalCharts;
        const currentVisibleCount = activeProject.analysis.charts.filter(c => c.visible).length;

        if (!targetChart.visible && currentVisibleCount >= maxCharts) {
            alert(`This layout supports a maximum of ${maxCharts} charts.`);
            return;
        }

        updateActiveProject(p => {
            if (!p.analysis) return p;
            const updatedCharts = p.analysis.charts.map(chart => chart.id === chartId ? { ...chart, visible: !chart.visible } : chart);
            return { ...p, analysis: { ...p.analysis, charts: updatedCharts } };
        });
    }, [activeProject, dashboardLayout, updateActiveProject]);

    const validationTasks = useMemo(() => {
        if (!validationReport) return [];
        return [
            `Parsed ${validationReport.rowCount.toLocaleString()} rows and ${validationReport.columnCount} columns`,
            'Assessed overall data quality score',
            validationReport.issues.some(i => i.type === 'missing_values') && 'Checked for missing values',
            validationReport.issues.some(i => i.type === 'duplicates') && 'Scanned for duplicate entries',
            'Prepared smart sample for AI analysis'
        ].filter(Boolean) as string[];
    }, [validationReport]);
    
    const handleGlobalFilterChange = useCallback((column: string, values: Set<string>) => {
        setGlobalFilters(prev => {
            if(column === '__clear__') return {};
            const newFilters = { ...prev };
            if (values.size === 0) {
                delete newFilters[column];
            } else {
                newFilters[column] = values;
            }
            return newFilters;
        });
    }, []);

    const handleTimeFilterChange = useCallback((filter: { type: TimeFilterPreset; start?: string; end?: string }) => {
        setTimeFilter(filter);
    }, []);

    const handleRemoveFilter = useCallback((column: string, value?: string) => {
        if (column === '__all__') {
            setGlobalFilters({});
            return;
        }
        setGlobalFilters(prev => {
            const newFilters = { ...prev };
            if (value && newFilters[column]) {
                const newSet = new Set(newFilters[column]);
                newSet.delete(value);
                if (newSet.size === 0) {
                    delete newFilters[column];
                } else {
                    newFilters[column] = newSet;
                }
            } else {
                 delete newFilters[column];
            }
            return newFilters;
        });
    }, []);
    
    const handleKpiClick = useCallback((kpi: KpiConfig) => {
        if (kpi.primaryCategory && kpi.primaryCategoryValue) {
            setGlobalFilters(prev => {
                const currentSet = prev[kpi.primaryCategory!] || new Set<string>();
                const newSet = new Set(currentSet);
                // Toggle behavior: if it's already the only filter for this category, remove it. Otherwise, set it as the only one.
                if (newSet.has(kpi.primaryCategoryValue!) && newSet.size === 1) {
                    newSet.delete(kpi.primaryCategoryValue!);
                } else {
                    newSet.clear();
                    newSet.add(kpi.primaryCategoryValue!);
                }
                
                const newFilters = { ...prev };
                if (newSet.size === 0) {
                    delete newFilters[kpi.primaryCategory!];
                } else {
                    newFilters[kpi.primaryCategory!] = newSet;
                }
                return newFilters;
            });
        } else {
            setSelectedKpi(kpi);
        }
    }, []);
    
    const handleTemplateSelected = async (template: ReportTemplate) => {
        if (!activeProject || !activeProject.analysis) return;
        
        setIsReportTemplateModalOpen(false);
        setStatus('analyzing');
        setProgress({ status: 'AI is designing your presentation...', percentage: 50 });
        
        try {
            const newPresentation = await generateInitialPresentation(activeProject.analysis, template, activeProject.name);
            
            updateActiveProject(p => ({
                ...p,
                presentations: [...(p.presentations || []), newPresentation],
            }));
            
            setEditingPresentationId(newPresentation.id);
            setStatus('complete');
            setProgress(null);

        } catch (err: any) {
            setError(err.message || "Failed to generate presentation.");
            setStatus('error');
            setProgress(null);
        }
    };
    
    const handlePresentationUpdate = useCallback((updatedPresentation: Presentation) => {
        updateActiveProject(p => {
            if (!p) return p;
            const newPresentations = p.presentations ? p.presentations.map(pres => pres.id === updatedPresentation.id ? updatedPresentation : pres) : [updatedPresentation];
            return {
                ...p,
                presentations: newPresentations,
            };
        });
    }, [updateActiveProject]);

    const renderMainContent = () => {
        if (mainView === 'settings') {
            return <SettingsPage />;
        }
        if (mainView === 'account') {
            return <AccountPage userEmail={userEmail} onLogout={onLogout} />;
        }

        if (!activeProject) {
            return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={status === 'parsing'} progress={progress} error={error} />;
        }

        switch (status) {
            case 'idle':
                if (activeProject.dataSource.data.length === 0) {
                    return <ProjectSetup project={activeProject} onFileSelect={handleFileSelect} onRename={() => handleOpenRenameModal(activeProject)} />;
                }
            case 'complete':
                if (activeProject.analysis) {
                    return <ProjectWorkspace
                        project={activeProject}
                        filteredData={filteredData}
                        onOpenEditModal={() => setIsSettingsModalOpen(true)}
                        setIsLayoutModalOpen={setIsLayoutModalOpen}
                        onCreateReport={() => setIsReportTemplateModalOpen(true)}
                        onSelectPresentation={setEditingPresentationId}
                        dashboardLayout={dashboardLayout}
                        dateColumn={dateColumn}
                        onChartUpdate={handleChartUpdate}
                        onSetMaximizedChart={setMaximizedChart}
                        saveStatus={saveStatus}
                        onManualSave={handleManualSave}
                        globalFilters={globalFilters}
                        timeFilter={timeFilter}
                        onGlobalFilterChange={handleGlobalFilterChange}
                        onTimeFilterChange={handleTimeFilterChange}
                        onRemoveFilter={handleRemoveFilter}
                        onKpiClick={handleKpiClick}
                        onProjectUpdate={updateActiveProject}
                        editingPresentationId={editingPresentationId}
                        onBackToHub={() => setEditingPresentationId(null)}
                        onPresentationUpdate={handlePresentationUpdate}
                        onPresent={setPresentingPresentationId}
                    />;
                }
                break;
            case 'validating_tasks':
                return <TaskValidator title="Finalizing Checks" subtitle="AI is verifying the structure and quality of your file." tasks={validationTasks} onComplete={handleValidationComplete} />;
            case 'validated':
                return <EmbeddedDataPreview data={activeProject.dataSource.data} report={validationReport!} onConfirm={handleConfirmPreview} onCancel={handleReset} />;
            case 'parsing':
            case 'analyzing':
                return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={true} progress={progress} error={error} />;
            case 'error':
                 return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={false} progress={null} error={error || 'An unexpected error occurred.'} />;
        }
        
        return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={false} progress={null} error={error || 'An unexpected error occurred.'} />;
    };

    const presentationToPresent = activeProject?.presentations?.find(p => p.id === presentingPresentationId);
    const isEditingOrPresenting = !!editingPresentationId || !!presentingPresentationId;

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
                onNewProject={handleReset} 
                savedProjects={savedProjects} 
                activeProjectId={activeProject?.id || null} 
                onSelectProject={handleSelectProject} 
                onRename={handleOpenRenameModal} 
                onDelete={handleOpenDeleteModal} 
                userEmail={userEmail} 
                onLogout={onLogout}
                mainView={mainView}
                setMainView={setMainView}
            />
            <div className={`flex-1 flex flex-col transition-all duration-300 md:ml-20 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
                <header className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200"><div className="h-16 flex items-center justify-between px-4"><div className="flex items-center min-w-0"><button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 mr-2 text-slate-600 hover:text-primary-600"><Menu size={24} /></button><h2 className="text-lg font-bold text-slate-900 truncate" title={activeProject?.name || 'New Project'}>{activeProject?.name || 'New Project'}</h2></div></div></header>
                <main ref={mainContentRef} className={`flex-1 ${isEditingOrPresenting ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
                    {renderMainContent()}
                </main>
            </div>
            
            {presentingPresentationId && activeProject && presentationToPresent && (
                <Suspense fallback={<div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}>
                    <PresentationView 
                        project={activeProject} 
                        presentation={presentationToPresent} 
                        onClose={() => setPresentingPresentationId(null)} 
                    />
                </Suspense>
            )}

            <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleCreateProject} />
            <SaveProjectModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={handleSaveProject} defaultName={activeProject?.name || 'Untitled Project'} />
            <RenameProjectModal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} onSave={handleRenameProject} currentName={projectToManage?.name || ''} currentDescription={projectToManage?.description || ''} />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteProject} projectName={projectToManage?.name || ''} />
            {maximizedChart && activeProject && <ChartMaximizeModal 
                config={maximizedChart} 
                data={filteredData} 
                allData={activeProject.dataSource.data}
                dateColumn={dateColumn} 
                onUpdate={handleChartUpdate} 
                onClose={() => setMaximizedChart(null)}
                onFilterChange={handleGlobalFilterChange}
                onTimeFilterChange={handleTimeFilterChange}
                activeFilters={globalFilters}
                activeTimeFilter={timeFilter}
            />}
            {activeProject && <KpiDetailModal
                isOpen={!!selectedKpi}
                onClose={() => setSelectedKpi(null)}
                kpi={selectedKpi}
                project={activeProject}
                dateColumn={dateColumn}
            />}
            <LayoutSelectionModal
                isOpen={isLayoutModalOpen}
                onClose={() => setIsLayoutModalOpen(false)}
                currentLayout={dashboardLayout}
                onSelectLayout={handleSelectLayout}
                layouts={layouts}
            />
             <ReportTemplateSelectionModal
                isOpen={isReportTemplateModalOpen}
                onClose={() => setIsReportTemplateModalOpen(false)}
                onSelect={handleTemplateSelected}
            />
            {activeProject && activeProject.analysis && (
                <DashboardSettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    project={activeProject}
                    dashboardLayout={dashboardLayout}
                    onKpiVisibilityToggle={handleKpiVisibilityToggle}
                    onChartVisibilityToggle={handleChartVisibilityToggle}
                    onAddCustomKpi={handleAddCustomKpi}
                    layouts={layouts}
                />
            )}
        </div>
    );
};