import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { AnalysisResult, DataRow, ChartConfig, LoadingState, DataQualityReport, Project, KpiConfig, LayoutInfo, SaveStatus } from '../types.ts';
import { ChartRenderer } from './charts/ChartRenderer.tsx';
import { Download, Menu, FileText, BarChart3, Bot, UploadCloud, Edit3, Edit, LayoutGrid, PlusCircle, CheckCircle, Eye, EyeOff, GripVertical, Settings, Loader2 } from 'lucide-react';
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
import { DataTable } from './DataTable.tsx';
import { AIReportView } from './AIReportView.tsx';
import { processFile } from '../services/dataParser.ts';
import { analyzeData, generateAiReport } from '../services/geminiService.ts';
import { LayoutSelectionModal } from './modals/LayoutSelectionModal.tsx';

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
    const getInitialState = () => window.innerWidth >= 1024;
    const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialState);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            } else if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        handleResize();
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

const DEFAULT_KPI: Omit<KpiConfig, 'id'> = { title: '', column: '', operation: 'sum', format: 'number', isCustom: true };

const KpiSection: React.FC<{ kpiValues: (KpiConfig & { displayValue: string })[] }> = ({ kpiValues }) => {
    if (kpiValues.length === 0) return null;
    return (
        <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Key Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">{kpiValues.map((kpi) => <div key={kpi.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><div><p className="text-sm font-medium text-slate-500 mb-1 truncate">{kpi.title}</p><p className="text-3xl font-bold text-slate-900">{kpi.displayValue}</p></div></div>)}</div>
        </section>
    );
};

const DashboardView: React.FC<{
    chartRows: ChartConfig[][];
    getGridColsClass: (count: number) => string;
    dataSource: { data: DataRow[] };
    dateColumn: string | null;
    onChartUpdate: (updatedChart: ChartConfig) => void;
    onSetMaximizedChart: (chart: ChartConfig | null) => void;
}> = ({ chartRows, getGridColsClass, dataSource, dateColumn, onChartUpdate, onSetMaximizedChart }) => (
    <section>
        {chartRows.map((row, rowIndex) => (
            <div key={rowIndex} className={`grid grid-cols-1 ${getGridColsClass(row.length)} gap-6 lg:gap-8 mb-6 lg:mb-8`}>
                {row.map(chart => (
                    <div key={chart.id} className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px]">
                        <ChartRenderer config={chart} data={dataSource.data} dateColumn={dateColumn} onUpdate={onChartUpdate} onMaximize={onSetMaximizedChart} enableScrollZoom={true} />
                    </div>
                ))}
            </div>
        ))}
    </section>
);

const DashboardEditMode: React.FC<{
    project: Project;
    dashboardLayout: string;
    isAddingKpi: boolean;
    newKpiForm: Omit<KpiConfig, 'id'>;
    onKpiVisibilityToggle: (kpiId: string) => void;
    onChartVisibilityToggle: (chartId: string) => void;
    onAddCustomKpi: (e: React.FormEvent) => void;
    setIsAddingKpi: (isAdding: boolean) => void;
    setNewKpiForm: (form: Omit<KpiConfig, 'id'>) => void;
}> = ({ project, dashboardLayout, isAddingKpi, newKpiForm, onKpiVisibilityToggle, onChartVisibilityToggle, onAddCustomKpi, setIsAddingKpi, setNewKpiForm }) => {
    const analysis = project.analysis!;
    const visibleCharts = analysis.charts.filter(c => c.visible);
    const layout = layouts.find(l => l.id === dashboardLayout) || layouts[0];
    return (
        <section className="mb-8 p-6 bg-primary-50 border-2 border-dashed border-primary-200 rounded-2xl space-y-6 duration-300">
            <div>
                <h3 className="text-lg font-bold text-primary-900 mb-3 flex items-center"><Settings size={18} className="mr-2" /> Manage KPIs</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {analysis.kpis.map(kpi => (
                        <button key={kpi.id} onClick={() => onKpiVisibilityToggle(kpi.id)} className={`p-3 border rounded-lg text-left flex items-center justify-between w-full transition-all ${kpi.visible ? 'bg-white border-primary-300 ring-2 ring-primary-100' : 'bg-white/60 hover:bg-white border-slate-200 opacity-70 hover:opacity-100'}`}>
                            <div><p className={`font-medium ${kpi.visible ? 'text-primary-800' : 'text-slate-800'}`}>{kpi.title}</p><p className={`text-xs ${kpi.visible ? 'text-primary-600' : 'text-slate-500'}`}> {kpi.operation.replace('_', ' ')} of "{kpi.column}"</p></div>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${kpi.visible ? 'bg-primary-600 border-primary-600' : 'border-slate-300'}`}>{kpi.visible && <CheckCircle className="w-4 h-4 text-white" />}</div>
                        </button>
                    ))}
                </div>
                {isAddingKpi ? (
                    <form onSubmit={onAddCustomKpi} className="p-4 border border-primary-200 rounded-lg bg-white mt-4 space-y-3">
                        <h4 className="font-semibold text-primary-800">Add Custom KPI</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <input value={newKpiForm.title} onChange={e => setNewKpiForm({ ...newKpiForm, title: e.target.value })} placeholder="KPI Title" required className="w-full px-3 py-2 text-sm border bg-white border-slate-300 rounded-lg" />
                            <select value={newKpiForm.column} onChange={e => setNewKpiForm({ ...newKpiForm, column: e.target.value })} required className="w-full px-3 py-2 text-sm border bg-white border-slate-300 rounded-lg"><option value="">Select Column</option>{Object.keys(project.dataSource.data[0] || {}).map(c => <option key={c} value={c}>{c}</option>)}</select>
                            <select value={newKpiForm.operation} onChange={e => setNewKpiForm({ ...newKpiForm, operation: e.target.value as any })} className="w-full px-3 py-2 text-sm border bg-white border-slate-300 rounded-lg"><option value="sum">Sum</option><option value="average">Average</option><option value="count_distinct">Count Distinct</option></select>
                            <select value={newKpiForm.format} onChange={e => setNewKpiForm({ ...newKpiForm, format: e.target.value as any })} className="w-full px-3 py-2 text-sm border bg-white border-slate-300 rounded-lg"><option value="number">Number</option><option value="currency">Currency</option><option value="percent">Percent</option></select>
                        </div>
                        <div className="flex justify-end space-x-2"><button type="button" onClick={() => setIsAddingKpi(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button><button type="submit" className="px-3 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md">Add</button></div>
                    </form>
                ) : (<button onClick={() => setIsAddingKpi(true)} className="w-full mt-3 p-2 border-2 border-dashed border-primary-300 hover:border-primary-400 hover:bg-primary-100/50 rounded-lg text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center justify-center transition-colors"><PlusCircle size={16} className="mr-2" /> Add Custom KPI</button>)}
            </div>
            <div className="border-t border-primary-200/80"></div>
            <div>
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
            </div>
        </section>
    );
};

const ProjectSetup: React.FC<{ project: Project; onFileSelect: (file: File) => void; onRename: () => void }> = ({ project, onFileSelect, onRename }) => (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            return <div className="flex items-center text-xs text-amber-600"><div className="w-2 h-2 rounded-full bg-amber-400 mr-2 animate-pulse"></div>Unsaved changes</div>;
        case 'saving':
            return <div className="flex items-center text-xs text-slate-500"><Loader2 size={12} className="mr-2 animate-spin" /> Saving...</div>;
        case 'saved':
            return <div className="flex items-center text-xs text-green-600"><CheckCircle size={12} className="mr-2" /> All changes saved</div>;
        default:
            return null;
    }
};


const ProjectWorkspace: React.FC<{
    project: Project;
    currentView: 'dashboard' | 'ai-report' | 'data';
    setCurrentView: (view: 'dashboard' | 'ai-report' | 'data') => void;
    isEditMode: boolean;
    setIsEditMode: (isEditing: boolean) => void;
    setIsLayoutModalOpen: (isOpen: boolean) => void;
    dashboardLayout: string;
    isAddingKpi: boolean;
    setIsAddingKpi: (isAdding: boolean) => void;
    newKpiForm: Omit<KpiConfig, 'id'>;
    setNewKpiForm: (form: Omit<KpiConfig, 'id'>) => void;
    onKpiVisibilityToggle: (kpiId: string) => void;
    onChartVisibilityToggle: (chartId: string) => void;
    onAddCustomKpi: (e: React.FormEvent) => void;
    kpiValues: (KpiConfig & { displayValue: string })[];
    dateColumn: string | null;
    onChartUpdate: (updatedChart: ChartConfig) => void;
    onSetMaximizedChart: (chart: ChartConfig | null) => void;
    onGenerateReport: () => void;
    saveStatus: SaveStatus;
}> = ({ project, currentView, setCurrentView, isEditMode, setIsEditMode, setIsLayoutModalOpen, onGenerateReport, saveStatus, ...props }) => {
    
    const { analysis, dataSource } = project;
    const TabButton = ({ view, label, icon: Icon }: { view: 'dashboard' | 'ai-report' | 'data', label: string, icon: React.ElementType }) => (<button onClick={() => setCurrentView(view)} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors ${currentView === view ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}><Icon size={16} className="mr-2"/>{label}</button>);
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

    return (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 line-clamp-1">{project.name}</h2>
                    <div className="h-4 mt-1"><SaveStatusIndicator status={saveStatus} /></div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="p-1.5 bg-slate-100 rounded-lg inline-flex items-center space-x-1 border border-slate-200"><TabButton view="dashboard" label="Dashboard" icon={BarChart3} /><TabButton view="ai-report" label="AI Report" icon={Bot}/><TabButton view="data" label="Data View" icon={FileText} /></div>
                <div className="flex items-center space-x-2 w-full justify-end sm:w-auto">
                   <button onClick={() => setIsEditMode(!isEditMode)} className={`px-4 py-2 text-sm font-medium border rounded-lg flex items-center transition-colors ${isEditMode ? 'bg-primary-600 text-white border-primary-600' : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-50'}`}>
                        <Edit size={16} className="mr-2" /> {isEditMode ? 'Done' : 'Edit'}
                    </button>
                    <button onClick={() => setIsLayoutModalOpen(true)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center">
                        <LayoutGrid size={16} className="mr-2" /> Layout
                    </button>
                     <button onClick={() => window.print()} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center"><Download size={16} className="mr-2" /> Export PDF</button>
                </div>
            </div>
            {currentView === 'dashboard' && (
            <>
                {isEditMode && <DashboardEditMode project={project} {...props} />}
                <KpiSection kpiValues={props.kpiValues} />
                <DashboardView chartRows={chartRows} getGridColsClass={getGridColsClass} dataSource={dataSource} dateColumn={props.dateColumn} onChartUpdate={props.onChartUpdate} onSetMaximizedChart={props.onSetMaximizedChart} />
            </>
            )}
            {currentView === 'ai-report' && <AIReportView project={project} onGenerate={onGenerateReport} />}
            {currentView === 'data' && <div className="h-[calc(100vh-280px)]"><DataTable data={dataSource.data} /></div>}
        </div>
    );
};

const useDebouncedCallback = (callback: (...args: any[]) => void, delay: number) => {
    const timeoutRef = useRef<number | null>(null);
    return useCallback((...args: any[]) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
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
    const [currentView, setCurrentView] = useState<'dashboard' | 'ai-report' | 'data'>('dashboard');
    const [maximizedChart, setMaximizedChart] = useState<ChartConfig | null>(null);
    const [dashboardLayout, setDashboardLayout] = useState<string>('2-2-2');
    const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAddingKpi, setIsAddingKpi] = useState(false);
    const [newKpiForm, setNewKpiForm] = useState<Omit<KpiConfig, 'id'>>(DEFAULT_KPI);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');


    const analysisPromiseRef = useRef<Promise<AnalysisResult> | null>(null);
    const mainContentRef = useRef<HTMLElement>(null);
    const saveStatusTimeoutRef = useRef<number | null>(null);

    // Load projects from local storage on initial mount
    useEffect(() => {
        try {
            const storedProjects = localStorage.getItem('ai-insights-projects');
            if (storedProjects) {
                 const projects: Project[] = JSON.parse(storedProjects, (key, value) => {
                    if (key === 'createdAt' && typeof value === 'string') {
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
    
     const debouncedSave = useDebouncedCallback((project: Project, allProjects: Project[]) => {
        setSaveStatus('saving');
        const updatedProjects = allProjects.map(p => p.id === project.id ? project : p);
        saveProjectsToLocalStorage(updatedProjects);
        setSavedProjects(updatedProjects);

        setTimeout(() => {
            setSaveStatus('saved');
            if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current);
            saveStatusTimeoutRef.current = window.setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    }, 1500);

    const updateActiveProject = (updater: (prev: Project) => Project) => {
        setActiveProject(prev => {
            if (!prev) return null;
            if (prev.id.startsWith('unsaved_')) return updater(prev);
            
            const updatedProject = updater(prev);
            setSaveStatus('unsaved');
            debouncedSave(updatedProject, savedProjects);
            return updatedProject;
        });
    };

    const handleFileSelect = async (file: File) => {
        let projectToUpdate = activeProject;
        
        if (projectToUpdate && projectToUpdate.dataSource.data.length === 0) {
            setActiveProject(p => p ? { ...p, dataSource: { ...p.dataSource, name: file.name } } : null);
        } else {
            projectToUpdate = {
                id: `unsaved_${Date.now()}`, name: file.name, description: '', createdAt: new Date(),
                dataSource: { name: file.name, data: [] }, analysis: null, aiReport: null,
            };
            setActiveProject(projectToUpdate);
        }

        setStatus('parsing');
        setError(null);
        setCurrentView('dashboard');
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
    };

    const handleValidationComplete = () => setStatus('validated');

    const handleConfirmPreview = async () => {
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
    };

    const handleReset = () => {
        setActiveProject(null);
        setStatus('idle');
        setError(null);
        setCurrentView('dashboard');
        setProgress(null);
        setIsEditMode(false);
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };
    
    const handleCreateProject = (name: string, description: string) => {
        const newProject: Project = {
            id: new Date().toISOString(), name, description, createdAt: new Date(),
            dataSource: { name: 'No data source', data: [] }, analysis: null, aiReport: null,
        };
        const updatedProjects = [newProject, ...savedProjects];
        setSavedProjects(updatedProjects);
        saveProjectsToLocalStorage(updatedProjects);
        setActiveProject(newProject);
        setIsCreateModalOpen(false);
    };

    const handleSaveProject = (name: string, description: string) => {
        if (!activeProject) return;
        const finalId = new Date().toISOString();
        const finalProject: Project = { ...activeProject, id: finalId, name, description, createdAt: new Date() };

        const updatedProjects = [finalProject, ...savedProjects];
        setSavedProjects(updatedProjects);
        saveProjectsToLocalStorage(updatedProjects);
        
        setActiveProject(finalProject);
        setIsSaveModalOpen(false);
    };

    const handleSelectProject = (projectId: string) => {
        const project = savedProjects.find(p => p.id === projectId);
        if (project) {
            setActiveProject(project);
            setStatus(project.dataSource.data.length > 0 ? 'complete' : 'idle');
            setCurrentView('dashboard');
            setIsEditMode(false);
            setSaveStatus('idle');
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
            mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleGenerateReport = async () => {
        if (!activeProject?.dataSource.data || !activeProject.analysis) return;
        updateActiveProject(p => ({ ...p, aiReport: { content: '', status: 'generating' } }));
        try {
            const reportContent = await generateAiReport(activeProject.dataSource.data, activeProject.analysis);
            updateActiveProject(p => ({ ...p, aiReport: { content: reportContent, status: 'complete' } }));
        } catch(err: any) {
            updateActiveProject(p => ({ ...p, aiReport: null }));
        }
    };

    const handleOpenRenameModal = (project: Project) => { setProjectToManage(project); setIsRenameModalOpen(true); };
    const handleRenameProject = (name: string, description: string) => {
        if (!projectToManage) return;
        const updatedProject = { ...projectToManage, name, description };
        const updatedProjects = savedProjects.map(p => p.id === projectToManage.id ? updatedProject : p);
        setSavedProjects(updatedProjects);
        saveProjectsToLocalStorage(updatedProjects);
        if (activeProject?.id === projectToManage.id) setActiveProject(updatedProject);
    };

    const handleOpenDeleteModal = (project: Project) => { setProjectToManage(project); setIsDeleteModalOpen(true); };
    const handleDeleteProject = () => {
        if (!projectToManage) return;
        const updatedProjects = savedProjects.filter(p => p.id !== projectToManage.id);
        setSavedProjects(updatedProjects);
        saveProjectsToLocalStorage(updatedProjects);
        if (activeProject?.id === projectToManage.id) handleReset();
    };
    
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
    }, [activeProject, maximizedChart]);

    const handleSelectLayout = (layoutId: string) => {
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
    };
    
    const handleKpiVisibilityToggle = (kpiId: string) => {
        updateActiveProject(p => {
            if (!p.analysis) return p;
            const updatedKpis = p.analysis.kpis.map(kpi => kpi.id === kpiId ? { ...kpi, visible: !kpi.visible } : kpi);
            return { ...p, analysis: { ...p.analysis, kpis: updatedKpis } };
        });
    };

    const handleAddCustomKpi = (e: React.FormEvent) => {
        e.preventDefault();
        updateActiveProject(p => {
            if (!p.analysis) return p;
            const newKpi = { ...newKpiForm, id: `custom_${Date.now()}`, visible: true };
            const updatedKpis = [...p.analysis.kpis, newKpi];
            return { ...p, analysis: { ...p.analysis, kpis: updatedKpis } };
        });
        setIsAddingKpi(false);
        setNewKpiForm(DEFAULT_KPI);
    };
    
    const handleChartVisibilityToggle = (chartId: string) => {
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
    };

    const dateColumn = useMemo(() => {
        const data = activeProject?.dataSource.data;
        if (!data || data.length < 5) return null;
        const columns = Object.keys(data[0]);
        return columns.find(col => !isNaN(Date.parse(String(data[4]?.[col])))) || null;
    }, [activeProject]);

    const kpiValues = useMemo(() => {
        const data = activeProject?.dataSource.data;
        const analysis = activeProject?.analysis;
        if (!analysis || !data) return [];
        
        return analysis.kpis.filter(kpi => kpi.visible).map(kpi => {
            let value = 0;
            if (kpi.operation === 'sum') value = data.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0);
            else if (kpi.operation === 'average') value = data.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0) / (data.length || 1);
            else if (kpi.operation === 'count_distinct') value = new Set(data.map(row => row[kpi.column])).size;
            return { ...kpi, displayValue: new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(value) };
        });
    }, [activeProject]);

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
    
    const renderMainContent = () => {
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
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        isEditMode={isEditMode}
                        setIsEditMode={setIsEditMode}
                        setIsLayoutModalOpen={setIsLayoutModalOpen}
                        dashboardLayout={dashboardLayout}
                        isAddingKpi={isAddingKpi}
                        setIsAddingKpi={setIsAddingKpi}
                        newKpiForm={newKpiForm}
                        setNewKpiForm={setNewKpiForm}
                        onKpiVisibilityToggle={handleKpiVisibilityToggle}
                        onChartVisibilityToggle={handleChartVisibilityToggle}
                        onAddCustomKpi={handleAddCustomKpi}
                        kpiValues={kpiValues}
                        dateColumn={dateColumn}
                        onChartUpdate={handleChartUpdate}
                        onSetMaximizedChart={setMaximizedChart}
                        onGenerateReport={handleGenerateReport}
                        saveStatus={saveStatus}
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

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onNewProject={handleReset} savedProjects={savedProjects} activeProjectId={activeProject?.id || null} onSelectProject={handleSelectProject} onRename={handleOpenRenameModal} onDelete={handleOpenDeleteModal} userEmail={userEmail} onLogout={onLogout} />
            <div className={`flex-1 transition-all duration-300 md:ml-20 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
                <header className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200"><div className="h-16 flex items-center justify-between px-4"><div className="flex items-center min-w-0"><button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 mr-2 text-slate-600 hover:text-primary-600"><Menu size={24} /></button><h2 className="text-lg font-bold text-slate-900 truncate" title={activeProject?.name || 'New Project'}>{activeProject?.name || 'New Project'}</h2></div></div></header>
                <main ref={mainContentRef} className="h-full overflow-y-auto relative z-10" style={{ scrollBehavior: 'smooth' }}>{renderMainContent()}</main>
            </div>
            
            <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleCreateProject} />
            <SaveProjectModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={handleSaveProject} defaultName={activeProject?.name || 'Untitled Project'} />
            <RenameProjectModal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} onSave={handleRenameProject} currentName={projectToManage?.name || ''} currentDescription={projectToManage?.description || ''} />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteProject} projectName={projectToManage?.name || ''} />
            {maximizedChart && activeProject && <ChartMaximizeModal config={maximizedChart} data={activeProject.dataSource.data} dateColumn={dateColumn} onUpdate={handleChartUpdate} onClose={() => setMaximizedChart(null)} />}
            <LayoutSelectionModal
                isOpen={isLayoutModalOpen}
                onClose={() => setIsLayoutModalOpen(false)}
                currentLayout={dashboardLayout}
                onSelectLayout={handleSelectLayout}
                layouts={layouts}
            />
        </div>
    );
};