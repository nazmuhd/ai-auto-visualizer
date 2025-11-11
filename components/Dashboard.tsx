import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AnalysisResult, DataRow, ChartConfig, LoadingState, DataQualityReport, Project } from '../types.ts';
import { ChartRenderer } from './charts/ChartRenderer.tsx';
import { Sparkles, Save, Download, Check, Menu, FileText, BarChart3, Bot, UploadCloud, Edit3 } from 'lucide-react';
import { Sidebar } from './Sidebar.tsx';
import { GetStartedHub } from './GetStartedHub.tsx';
import { FileUploadContainer } from './FileUploadContainer.tsx';
import { TaskValidator } from './TaskValidator.tsx';
import { EmbeddedDataPreview } from './EmbeddedDataPreview.tsx';
import { CreateProjectModal } from './modals/CreateProjectModal.tsx';
import { SaveProjectModal } from './modals/SaveProjectModal.tsx';
import { RenameProjectModal } from './modals/RenameProjectModal.tsx';
import { DeleteConfirmationModal } from './modals/DeleteConfirmationModal.tsx';
import { DataTable } from './DataTable.tsx';
import { AIReportView } from './AIReportView.tsx';
import { processFileWithWorker } from '../services/dataParser.ts';
import { analyzeData, generateAiReport } from '../services/geminiService.ts';

interface Props {
    userEmail: string;
    onLogout: () => void;
}

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

export const Dashboard: React.FC<Props> = ({ userEmail, onLogout }) => {
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [status, setStatus] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [validationReport, setValidationReport] = useState<DataQualityReport | null>(null);
    const [progress, setProgress] = useState<{ status: string, percentage: number } | null>(null);
    const [savedProjects, setSavedProjects] = useState<Project[]>([]);
    
    // UI state
    const [isSidebarOpen, setIsSidebarOpen] = useResponsiveSidebar();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToManage, setProjectToManage] = useState<Project | null>(null);
    const [currentView, setCurrentView] = useState<'dashboard' | 'ai-report' | 'data'>('dashboard');

    const analysisPromiseRef = useRef<Promise<AnalysisResult> | null>(null);
    const mainContentRef = useRef<HTMLElement>(null);
    
    // --- Data Processing & Analysis Flow ---

    const handleFileSelect = async (file: File) => {
        let projectToUpdate = activeProject;
        
        // Flow B: Populating an existing, empty project
        if (projectToUpdate && projectToUpdate.dataSource.data.length === 0) {
            setActiveProject(p => p ? { ...p, dataSource: { ...p.dataSource, name: file.name }, isUnsaved: true } : null);
             setSavedProjects(prev => prev.map(p => p.id === projectToUpdate!.id ? { ...p, dataSource: { ...p.dataSource, name: file.name }, isUnsaved: true } : p));
        } else {
            // Flow A: Fast-track, creating a new unsaved project
            projectToUpdate = {
                id: `unsaved_${Date.now()}`,
                name: file.name,
                description: '',
                createdAt: new Date(),
                isUnsaved: true,
                dataSource: { name: file.name, data: [] },
                analysis: null,
                aiReport: null,
            };
            setActiveProject(projectToUpdate);
        }

        setStatus('parsing');
        setError(null);
        setCurrentView('dashboard');
        setProgress({ status: 'Initiating upload...', percentage: 0 });

        try {
            const result = await processFileWithWorker(file, (status, percentage) => {
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
            setActiveProject(p => p ? { ...p, analysis: result } : null);
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
    };
    
    // --- Project Management ---

    const handleCreateProject = (name: string, description: string) => {
        const newProject: Project = {
            id: new Date().toISOString(),
            name,
            description,
            createdAt: new Date(),
            isUnsaved: false,
            dataSource: { name: 'No data source', data: [] },
            analysis: null,
            aiReport: null,
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

        if (isUpdating) {
            setSavedProjects(savedProjects.map(p => p.id === finalId ? finalProject : p));
        } else {
            setSavedProjects([finalProject, ...savedProjects]);
        }
        setActiveProject(finalProject);
        setIsSaveModalOpen(false);
    };

    const handleSelectProject = (projectId: string) => {
        const project = savedProjects.find(p => p.id === projectId);
        if (project) {
            setActiveProject(project);
            // If the selected project has data, it's complete. Otherwise, it's idle.
            setStatus(project.dataSource.data.length > 0 ? 'complete' : 'idle');
            setCurrentView('dashboard');
            if (window.innerWidth < 768) setIsSidebarOpen(false);
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
            // Handle error, maybe show a toast
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
    
    // --- UI Handlers & Memoized Values ---

    const handleChartUpdate = (updatedChart: ChartConfig) => {
        if (!activeProject || !activeProject.analysis) return;
        const updatedAnalysis = {
            ...activeProject.analysis,
            charts: activeProject.analysis.charts.map(c => c.id === updatedChart.id ? updatedChart.id : c)
        };
        const updatedProject = { ...activeProject, analysis: updatedAnalysis, isUnsaved: true };
        setActiveProject(updatedProject);
        
        if (!updatedProject.id.startsWith('unsaved_')) {
             setSavedProjects(prev => prev.map(p => p.id === updatedProject.id ? { ...p, isUnsaved: true } : p));
        }
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
        return analysis.kpis.map(kpi => {
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

    // --- Main Render Logic ---
    const renderSaveButton = () => {
        if (!activeProject) return null;
        if (activeProject.isUnsaved) {
            const isNew = activeProject.id.startsWith('unsaved_');
            return <button onClick={() => isNew ? setIsSaveModalOpen(true) : handleSaveProject(activeProject.name, activeProject.description)} className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center shadow-sm ${isNew ? 'bg-primary-600 hover:bg-primary-700' : 'bg-amber-500 hover:bg-amber-600'}`}><Save size={16} className="mr-2" /> {isNew ? 'Save Project' : 'Save Changes'}</button>;
        }
        return <button disabled className="px-4 py-2 text-sm font-medium text-green-800 bg-green-100 rounded-lg flex items-center cursor-default"><Check size={16} className="mr-2" /> Saved</button>;
    };

    const renderMainContent = () => {
        // State 1: No active project -> Show the Get Started Hub
        if (!activeProject) {
            return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={status === 'parsing'} progress={progress} error={error} />;
        }
        
        // State 2: Project exists but has no data -> Show uploader inside the workspace
        if (activeProject.dataSource.data.length === 0 && status === 'idle') {
            return (
                 <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 line-clamp-1">{activeProject.name}</h2>
                            <p className="text-sm text-slate-500">{activeProject.description || "No description provided."}</p>
                        </div>
                        <div>
                            <button 
                                onClick={() => handleOpenRenameModal(activeProject)} 
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center"
                            >
                                <Edit3 size={16} className="mr-2" />
                                Edit Project
                            </button>
                        </div>
                    </div>
                     <div className="p-8 bg-white rounded-2xl border-2 border-dashed border-slate-300 text-center">
                        <div className="p-3 bg-primary-100 text-primary-600 rounded-full mb-4 inline-block">
                            <UploadCloud size={32} />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-1">Add a Data Source</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">To get started, please upload the data file for your project "{activeProject.name}".</p>
                        <FileUploadContainer onFileSelect={handleFileSelect} />
                    </div>
                </div>
            );
        }

        // States 3, 4, 5: Parsing, Validating, Analyzing
        if (status === 'validating_tasks') return <TaskValidator title="Finalizing Checks" subtitle="AI is verifying the structure and quality of your file." tasks={validationTasks} onComplete={handleValidationComplete} />;
        if (status === 'validated') return <EmbeddedDataPreview data={activeProject.dataSource.data} report={validationReport!} onConfirm={handleConfirmPreview} onCancel={handleReset} />;
        if (status === 'parsing' || status === 'analyzing') return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={true} progress={progress} error={error} />;
        
        // State 6: Project is complete and has data + analysis
        if (status === 'complete' && activeProject.analysis) {
            const { analysis, dataSource } = activeProject;
            const TabButton = ({ view, label, icon: Icon }: { view: typeof currentView, label: string, icon: React.ElementType }) => (
                <button onClick={() => setCurrentView(view)} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors ${currentView === view ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                    <Icon size={16} className="mr-2"/>{label}
                </button>
            );
            return (
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 line-clamp-1">{activeProject.name}</h2>
                            <p className="text-sm text-slate-500">Last saved: {new Date(activeProject.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center space-x-2 w-full justify-end sm:w-auto">
                            <button onClick={() => window.print()} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center"><Download size={16} className="mr-2" /> Export PDF</button>
                            {renderSaveButton()}
                        </div>
                    </div>
                    <div className="mb-6 p-1.5 bg-slate-100 rounded-lg inline-flex items-center space-x-1 border border-slate-200">
                       <TabButton view="dashboard" label="Dashboard" icon={BarChart3} />
                       <TabButton view="ai-report" label="AI Report" icon={Bot}/>
                       <TabButton view="data" label="Data View" icon={FileText} />
                    </div>
                    
                    {currentView === 'dashboard' && (
                    <>
                        {analysis.summary?.length > 0 && (
                            <section id="executive-summary" className="mb-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
                                <div className="flex items-center mb-6"><Sparkles className="text-primary-600 mr-3" size={24} /><h2 className="text-2xl font-bold text-slate-900">Executive Summary</h2></div>
                                <ul className="space-y-4">{analysis.summary.map((p, i) => <li key={i} className="flex items-start"><span className="inline-block w-2 h-2 rounded-full bg-primary-500 mt-2 mr-3 shrink-0" /><p className="text-slate-700 leading-relaxed text-lg">{p}</p></li>)}</ul>
                            </section>
                        )}
                        {kpiValues.length > 0 && (
                            <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">{kpiValues.map((kpi, i) => <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><div><p className="text-sm font-medium text-slate-500 mb-1">{kpi.title}</p><p className="text-3xl font-bold text-slate-900">{kpi.displayValue}</p></div></div>)}</section>
                        )}
                        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                            {analysis.charts.map((chart) => <div key={chart.id} className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px]"><ChartRenderer config={chart} data={dataSource.data} dateColumn={dateColumn} onUpdate={handleChartUpdate} /></div>)}
                        </section>
                    </>
                    )}
                    {currentView === 'ai-report' && <AIReportView project={activeProject} onGenerate={handleGenerateReport} />}
                    {currentView === 'data' && <div className="h-[calc(100vh-280px)]"><DataTable data={dataSource.data} /></div>}
                </div>
            );
        }
        
        // Fallback for any other state (e.g., error) -> show hub with error
        return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={status === 'parsing' || status === 'analyzing'} progress={progress} error={error || 'An unexpected error occurred.'} />;
    };

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onNewProject={handleReset} savedProjects={savedProjects} activeProjectId={activeProject?.id || null} onSelectProject={handleSelectProject} onRename={handleOpenRenameModal} onDelete={handleOpenDeleteModal} userEmail={userEmail} onLogout={onLogout} />
            <div className={`flex-1 transition-all duration-300 md:ml-20 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
                <header className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200">
                    <div className="h-16 flex items-center justify-between px-4">
                        <div className="flex items-center min-w-0">
                            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 mr-2 text-slate-600 hover:text-primary-600"><Menu size={24} /></button>
                            <h2 className="text-lg font-bold text-slate-900 truncate" title={activeProject?.name || 'New Project'}>{activeProject?.name || 'New Project'}</h2>
                        </div>
                    </div>
                </header>
                <main ref={mainContentRef} className="h-full overflow-y-auto relative z-10" style={{ scrollBehavior: 'smooth' }}>{renderMainContent()}</main>
            </div>
            
            <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleCreateProject} />
            <SaveProjectModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={handleSaveProject} defaultName={activeProject?.name || 'Untitled Project'} />
            <RenameProjectModal 
                isOpen={isRenameModalOpen} 
                onClose={() => setIsRenameModalOpen(false)} 
                onSave={handleRenameProject} 
                currentName={projectToManage?.name || ''} 
                currentDescription={projectToManage?.description || ''}
            />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteProject} projectName={projectToManage?.name || ''} />
        </div>
    );
};