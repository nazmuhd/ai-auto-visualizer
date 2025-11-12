import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { AnalysisResult, DataRow, ChartConfig, LoadingState, DataQualityReport, Project, KpiConfig, LayoutInfo } from '../types.ts';
import { ChartRenderer } from './charts/ChartRenderer.tsx';
import { Download, Menu, FileText, BarChart3, Bot, UploadCloud, Edit3, Edit, LayoutGrid, PlusCircle, CheckCircle, Trash2, Settings, AlertCircle, Eye, EyeOff, GripVertical } from 'lucide-react';
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

interface Props {
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

export const Dashboard: React.FC<Props> = ({ userEmail, onLogout }) => {
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


    const analysisPromiseRef = useRef<Promise<AnalysisResult> | null>(null);
    const mainContentRef = useRef<HTMLElement>(null);
    
    const handleFileSelect = async (file: File) => {
        let projectToUpdate = activeProject;
        
        if (projectToUpdate && projectToUpdate.dataSource.data.length === 0) {
            setActiveProject(p => p ? { ...p, dataSource: { ...p.dataSource, name: file.name }, isUnsaved: true } : null);
             setSavedProjects(prev => prev.map(p => p.id === projectToUpdate!.id ? { ...p, dataSource: { ...p.dataSource, name: file.name }, isUnsaved: true } : p));
        } else {
            projectToUpdate = {
                id: `unsaved_${Date.now()}`, name: file.name, description: '', createdAt: new Date(), isUnsaved: true,
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
                 visible: index < 5 // Show first 5 KPIs by default
            }));

            setActiveProject(p => p ? { ...p, analysis: { ...result, charts: chartsWithVisibility, kpis: initialKpis } } : null);
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
            id: new Date().toISOString(), name, description, createdAt: new Date(), isUnsaved: false,
            dataSource: { name: 'No data source', data: [] }, analysis: null, aiReport: null,
        };
        setSavedProjects([newProject, ...savedProjects]);
        setActiveProject(newProject);
        setIsCreateModalOpen(false);
    };

    const handleSaveProject = (name: string, description: string) => {
        if (!activeProject) return;
        const isUpdating = !activeProject.id.startsWith('unsaved_');
        const finalId = isUpdating ? activeProject.id : new Date().toISOString();
        const finalProject: Project = { ...activeProject, id: finalId, name, description, isUnsaved: false };
        if (isUpdating) setSavedProjects(savedProjects.map(p => p.id === finalId ? finalProject : p));
        else setSavedProjects([finalProject, ...savedProjects]);
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
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
            mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleGenerateReport = async () => {
        if (!activeProject?.dataSource.data || !activeProject.analysis) return;
        setActiveProject(p => p ? { ...p, aiReport: { content: '', status: 'generating' } } : null);
        try {
            const reportContent = await generateAiReport(activeProject.dataSource.data, activeProject.analysis);
            setActiveProject(p => p ? { ...p, aiReport: { content: reportContent, status: 'complete' } } : null);
        } catch(err: any) {
            setActiveProject(p => p ? { ...p, aiReport: null } : null);
        }
    };

    const handleOpenRenameModal = (project: Project) => { setProjectToManage(project); setIsRenameModalOpen(true); };
    const handleRenameProject = (name: string, description: string) => {
        if (!projectToManage) return;
        const updatedProject = { ...projectToManage, name, description };
        setSavedProjects(savedProjects.map(p => p.id === projectToManage.id ? updatedProject : p));
        if (activeProject?.id === projectToManage.id) setActiveProject(updatedProject);
    };

    const handleOpenDeleteModal = (project: Project) => { setProjectToManage(project); setIsDeleteModalOpen(true); };
    const handleDeleteProject = () => {
        if (!projectToManage) return;
        setSavedProjects(savedProjects.filter(p => p.id !== projectToManage.id));
        if (activeProject?.id === projectToManage.id) handleReset();
    };
    
    const handleChartUpdate = useCallback((updatedChart: ChartConfig) => {
        if (!activeProject || !activeProject.analysis) return;
        
        const updatedAnalysis = {
            ...activeProject.analysis,
            charts: activeProject.analysis.charts.map(c => c.id === updatedChart.id ? updatedChart : c)
        };
        const updatedProject = { ...activeProject, analysis: updatedAnalysis, isUnsaved: true };
        setActiveProject(updatedProject);
        
        if (maximizedChart && maximizedChart.id === updatedChart.id) {
            setMaximizedChart(updatedChart);
        }
        
        if (!updatedProject.id.startsWith('unsaved_')) {
             setSavedProjects(prev => prev.map(p => p.id === updatedProject.id ? { ...p, isUnsaved: true } : p));
        }
    }, [activeProject, maximizedChart]);

    const handleSelectLayout = (layoutId: string) => {
        setDashboardLayout(layoutId);
        setIsLayoutModalOpen(false);
        if (!activeProject?.analysis) return;

        const newLayout = layouts.find(l => l.id === layoutId) || layouts[0];
        const maxCharts = newLayout.totalCharts;
        let visibleCount = 0;
        
        const updatedCharts = activeProject.analysis.charts.map(chart => {
            const shouldBeVisible = chart.visible && visibleCount < maxCharts;
            if (shouldBeVisible) visibleCount++;
            return { ...chart, visible: shouldBeVisible };
        });

        // If after checking existing visible charts, we are still under capacity,
        // turn on more charts until the capacity is met.
        if (visibleCount < maxCharts) {
            for (let chart of updatedCharts) {
                if (visibleCount >= maxCharts) break;
                if (!chart.visible) {
                    chart.visible = true;
                    visibleCount++;
                }
            }
        }

        setActiveProject(p => p ? { ...p, analysis: { ...p.analysis!, charts: updatedCharts }, isUnsaved: true } : null);
    };
    
    const handleKpiVisibilityToggle = (kpiId: string) => {
        if (!activeProject?.analysis) return;
        const updatedKpis = activeProject.analysis.kpis.map(kpi => 
            kpi.id === kpiId ? { ...kpi, visible: !kpi.visible } : kpi
        );
        setActiveProject(p => p ? { ...p, analysis: { ...p.analysis!, kpis: updatedKpis }, isUnsaved: true } : null);
    };

    const handleAddCustomKpi = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject?.analysis) return;
        const newKpi = { ...newKpiForm, id: `custom_${Date.now()}`, visible: true };
        const updatedKpis = [...activeProject.analysis.kpis, newKpi];
        setActiveProject(p => p ? { ...p, analysis: { ...p.analysis!, kpis: updatedKpis }, isUnsaved: true } : null);
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

        // Prevent adding more charts than the layout allows
        if (!targetChart.visible && currentVisibleCount >= maxCharts) {
            alert(`This layout supports a maximum of ${maxCharts} charts.`);
            return;
        }

        const updatedCharts = activeProject.analysis.charts.map(chart => 
            chart.id === chartId ? { ...chart, visible: !chart.visible } : chart
        );
        setActiveProject(p => p ? { ...p, analysis: { ...p.analysis!, charts: updatedCharts }, isUnsaved: true } : null);
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
        if (!activeProject) return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={status === 'parsing'} progress={progress} error={error} />;
        if (activeProject.dataSource.data.length === 0 && status === 'idle') return <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="flex justify-between items-center gap-4 mb-6"><div className="flex-1 min-w-0"><h2 className="text-2xl font-bold text-slate-900 truncate">{activeProject.name}</h2><p className="text-sm text-slate-500 truncate">{activeProject.description || "No description provided."}</p></div><div className="flex-shrink-0"><button onClick={() => handleOpenRenameModal(activeProject)} className="p-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center"><Edit3 size={16} /></button></div></div><div className="p-8 bg-white rounded-2xl border-2 border-dashed border-slate-300 text-center"><div className="p-3 bg-primary-100 text-primary-600 rounded-full mb-4 inline-block"><UploadCloud size={32} /></div><h3 className="text-xl font-semibold text-slate-900 mb-1">Add a Data Source</h3><p className="text-slate-500 mb-6 max-w-md mx-auto">To get started, please upload the data file for your project "{activeProject.name}".</p><FileUploadContainer onFileSelect={handleFileSelect} /></div></div>;
        if (status === 'validating_tasks') return <TaskValidator title="Finalizing Checks" subtitle="AI is verifying the structure and quality of your file." tasks={validationTasks} onComplete={handleValidationComplete} />;
        if (status === 'validated') return <EmbeddedDataPreview data={activeProject.dataSource.data} report={validationReport!} onConfirm={handleConfirmPreview} onCancel={handleReset} />;
        if (status === 'parsing' || status === 'analyzing') return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={true} progress={progress} error={error} />;
        
        if (status === 'complete' && activeProject.analysis) {
            const { analysis, dataSource } = activeProject;
            const TabButton = ({ view, label, icon: Icon }: { view: typeof currentView, label: string, icon: React.ElementType }) => (<button onClick={() => setCurrentView(view)} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors ${currentView === view ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}><Icon size={16} className="mr-2"/>{label}</button>);
            const visibleCharts = analysis.charts.filter(c => c.visible);
            const chartRows = structureChartsByLayout(visibleCharts, dashboardLayout);
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
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div><h2 className="text-2xl font-bold text-slate-900 line-clamp-1">{activeProject.name}</h2><p className="text-sm text-slate-500">Last saved: {new Date(activeProject.createdAt).toLocaleString()}</p></div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                        <div className="p-1.5 bg-slate-100 rounded-lg inline-flex items-center space-x-1 border border-slate-200"><TabButton view="dashboard" label="Dashboard" icon={BarChart3} /><TabButton view="ai-report" label="AI Report" icon={Bot}/><TabButton view="data" label="Data View" icon={FileText} /></div>
                        <div className="flex items-center space-x-2 w-full justify-end sm:w-auto">
                           <button onClick={() => setIsEditMode(p => !p)} className={`px-4 py-2 text-sm font-medium border rounded-lg flex items-center transition-colors ${isEditMode ? 'bg-primary-600 text-white border-primary-600' : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-50'}`}>
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
                         {isEditMode && (
                            <section className="mb-8 p-6 bg-primary-50 border-2 border-dashed border-primary-200 rounded-2xl space-y-6 animate-in fade-in duration-300">
                                {/* Manage KPIs */}
                                <div>
                                    <h3 className="text-lg font-bold text-primary-900 mb-3 flex items-center"><Settings size={18} className="mr-2" /> Manage KPIs</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {analysis.kpis.map(kpi => (
                                            <button key={kpi.id} onClick={() => handleKpiVisibilityToggle(kpi.id)} className={`p-3 border rounded-lg text-left flex items-center justify-between w-full transition-all ${kpi.visible ? 'bg-white border-primary-300 ring-2 ring-primary-100' : 'bg-white/60 hover:bg-white border-slate-200 opacity-70 hover:opacity-100'}`}>
                                                <div>
                                                    <p className={`font-medium ${kpi.visible ? 'text-primary-800' : 'text-slate-800'}`}>{kpi.title}</p>
                                                    <p className={`text-xs ${kpi.visible ? 'text-primary-600' : 'text-slate-500'}`}> {kpi.operation.replace('_', ' ')} of "{kpi.column}"</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${kpi.visible ? 'bg-primary-600 border-primary-600' : 'border-slate-300'}`}>{kpi.visible && <CheckCircle className="w-4 h-4 text-white" />}</div>
                                            </button>
                                        ))}
                                    </div>
                                    {isAddingKpi ? (
                                        <form onSubmit={handleAddCustomKpi} className="p-4 border border-primary-200 rounded-lg bg-white mt-4 space-y-3">
                                            <h4 className="font-semibold text-primary-800">Add Custom KPI</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input value={newKpiForm.title} onChange={e => setNewKpiForm(f => ({...f, title: e.target.value}))} placeholder="KPI Title" required className="w-full px-3 py-2 text-sm border bg-white border-slate-300 rounded-lg"/>
                                                <select value={newKpiForm.column} onChange={e => setNewKpiForm(f => ({...f, column: e.target.value}))} required className="w-full px-3 py-2 text-sm border bg-white border-slate-300 rounded-lg"><option value="">Select Column</option>{Object.keys(dataSource.data[0] || {}).map(c => <option key={c} value={c}>{c}</option>)}</select>
                                                <select value={newKpiForm.operation} onChange={e => setNewKpiForm(f => ({...f, operation: e.target.value as any}))} className="w-full px-3 py-2 text-sm border bg-white border-slate-300 rounded-lg"><option value="sum">Sum</option><option value="average">Average</option><option value="count_distinct">Count Distinct</option></select>
                                                <select value={newKpiForm.format} onChange={e => setNewKpiForm(f => ({...f, format: e.target.value as any}))} className="w-full px-3 py-2 text-sm border bg-white border-slate-300 rounded-lg"><option value="number">Number</option><option value="currency">Currency</option><option value="percent">Percent</option></select>
                                            </div>
                                            <div className="flex justify-end space-x-2"><button type="button" onClick={() => setIsAddingKpi(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button><button type="submit" className="px-3 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md">Add</button></div>
                                        </form>
                                    ) : ( <button onClick={() => setIsAddingKpi(true)} className="w-full mt-3 p-2 border-2 border-dashed border-primary-300 hover:border-primary-400 hover:bg-primary-100/50 rounded-lg text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center justify-center transition-colors"><PlusCircle size={16} className="mr-2"/> Add Custom KPI</button>)}
                                </div>
                                <div className="border-t border-primary-200/80"></div>
                                {/* Manage Charts */}
                                <div>
                                    <h3 className="text-lg font-bold text-primary-900 mb-3 flex items-center"><Settings size={18} className="mr-2" /> Manage Charts</h3>
                                    <p className="text-sm text-primary-800/80 mb-3">You are showing <span className="font-bold">{visibleCharts.length}</span> of <span className="font-bold">{analysis.charts.length}</span> AI-generated charts. Your current layout supports up to <span className="font-bold">{(layouts.find(l=>l.id===dashboardLayout) || layouts[0]).totalCharts}</span> charts.</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {analysis.charts.map(chart => (
                                            <button key={chart.id} onClick={() => handleChartVisibilityToggle(chart.id)} className={`p-3 border rounded-lg text-left w-full transition-all flex items-center gap-3 ${chart.visible ? 'bg-white border-primary-300 ring-2 ring-primary-100' : 'bg-white/60 hover:bg-white border-slate-200 opacity-70 hover:opacity-100'}`}>
                                                <GripVertical className="text-slate-300 flex-shrink-0 cursor-grab" size={16}/>
                                                <div className="flex-1 truncate"><p className="font-medium text-slate-800 truncate">{chart.title}</p></div>
                                                {chart.visible ? <Eye size={16} className="text-primary-500 flex-shrink-0" /> : <EyeOff size={16} className="text-slate-400 flex-shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {kpiValues.length > 0 && (
                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">Key Metrics</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">{kpiValues.map((kpi, i) => <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><div><p className="text-sm font-medium text-slate-500 mb-1 truncate">{kpi.title}</p><p className="text-3xl font-bold text-slate-900">{kpi.displayValue}</p></div></div>)}</div>
                            </section>
                        )}
                        <section>
                           {chartRows.map((row, rowIndex) => (
                                <div key={rowIndex} className={`grid grid-cols-1 ${getGridColsClass(row.length)} gap-6 lg:gap-8 mb-6 lg:mb-8`}>
                                    {row.map(chart => (
                                        <div key={chart.id} className="min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[450px]">
                                            <ChartRenderer config={chart} data={dataSource.data} dateColumn={dateColumn} onUpdate={handleChartUpdate} onMaximize={setMaximizedChart} />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </section>
                    </>
                    )}
                    {currentView === 'ai-report' && <AIReportView project={activeProject} onGenerate={handleGenerateReport} />}
                    {currentView === 'data' && <div className="h-[calc(100vh-280px)]"><DataTable data={dataSource.data} /></div>}
                </div>
            );
        }
        
        return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={status === 'parsing' || status === 'analyzing'} progress={progress} error={error || 'An unexpected error occurred.'} />;
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