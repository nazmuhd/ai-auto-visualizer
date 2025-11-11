
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AnalysisResult, DataRow, ChartConfig, KpiConfig, LoadingState, DataQualityReport, SavedDashboard } from '../types.ts';
import { ChartRenderer } from './charts/ChartRenderer.tsx';
import { Sparkles, Save, Download, Check, Menu } from 'lucide-react';
import { Sidebar } from './Sidebar.tsx';
import { EmbeddedFileUpload } from './EmbeddedFileUpload.tsx';
import { TaskValidator } from './TaskValidator.tsx';
import { EmbeddedDataPreview } from './EmbeddedDataPreview.tsx';
import { SaveDashboardModal } from './SaveDashboardModal.tsx';
import { RenameDashboardModal } from './modals/RenameDashboardModal.tsx';
import { DeleteConfirmationModal } from './modals/DeleteConfirmationModal.tsx';
import { DataTable } from './DataTable.tsx';
import { processFileWithWorker } from '../services/dataParser.ts';
import { analyzeData } from '../services/geminiService.ts';

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
                setIsSidebarOpen(false); // Always closed on mobile unless manually opened
            } else if (window.innerWidth < 1024) {
                setIsSidebarOpen(false); // Default to collapsed on tablet
            } else {
                setIsSidebarOpen(true); // Default to open on desktop
            }
        };
        handleResize(); // Set initial state
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return [isSidebarOpen, setIsSidebarOpen] as const;
};

export const Dashboard: React.FC<Props> = ({ userEmail, onLogout }) => {
    // Core data state - Use useRef for large data to avoid performance-killing re-renders
    const currentDataRef = useRef<DataRow[] | null>(null);
    const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
    const [currentFileName, setCurrentFileName] = useState<string | null>(null);
    
    // State for the entire app flow
    const [status, setStatus] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [validationReport, setValidationReport] = useState<DataQualityReport | null>(null);
    const [progress, setProgress] = useState<{ status: string, percentage: number } | null>(null);

    // State for managing multiple dashboards
    const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>([]);
    const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);

    // UI state for modals and views
    const [isSidebarOpen, setIsSidebarOpen] = useResponsiveSidebar();
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [dashboardToManage, setDashboardToManage] = useState<SavedDashboard | null>(null);
    const [currentView, setCurrentView] = useState<'dashboard' | 'data'>('dashboard');

    const analysisPromiseRef = useRef<Promise<AnalysisResult> | null>(null);
    const mainContentRef = useRef<HTMLElement>(null);
    
    // --- Data Processing & Analysis Flow ---

    const handleFileSelect = async (file: File) => {
        setStatus('parsing'); // Use a single "processing" state now
        setError(null);
        setActiveDashboardId(null); 
        setCurrentView('dashboard');
        setProgress({ status: 'Initiating upload...', percentage: 0 });

        try {
            const result = await processFileWithWorker(file, (status, percentage) => {
                setProgress({ status, percentage });
            });
            
            currentDataRef.current = result.data;
            setCurrentFileName(file.name);
            setValidationReport(result.report);
            
            // The worker is done, now show the task validation animation
            setStatus('validating_tasks'); 
            
            // Kick off Gemini analysis in the background while user previews data
            analysisPromiseRef.current = analyzeData(result.sample);
            
        } catch (err: any) {
            setError(err.message || "Error processing file.");
            setStatus('error');
            setProgress(null);
        }
    };

    const handleValidationComplete = () => {
        setStatus('validated');
    };

    const handleConfirmPreview = async () => {
        if (!currentDataRef.current) return;
        setStatus('analyzing');
        setProgress({ status: 'AI is generating insights...', percentage: 50 });
        try {
            const result = await analysisPromiseRef.current!;
            setCurrentAnalysis(result);
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
        currentDataRef.current = null;
        setCurrentAnalysis(null);
        setActiveDashboardId(null);
        setStatus('idle');
        setError(null);
        setCurrentView('dashboard');
        setProgress(null);
    };
    
    // --- Dashboard Management ---

    const handleSaveDashboard = (name: string) => {
        if (!currentDataRef.current || !currentAnalysis) return;

        const activeDashboard = savedDashboards.find(d => d.id === activeDashboardId);

        if (activeDashboard) { // This is an update to an existing dashboard
            const updatedDashboards = savedDashboards.map(d => 
                d.id === activeDashboardId 
                ? { ...d, name, data: currentDataRef.current!, analysis: currentAnalysis!, isUnsaved: false } 
                : d
            );
            setSavedDashboards(updatedDashboards);
        } else { // This is a new dashboard being saved
            const newDashboard: SavedDashboard = {
                id: new Date().toISOString(),
                name,
                data: currentDataRef.current,
                analysis: currentAnalysis,
                createdAt: new Date(),
                isUnsaved: false
            };
            setSavedDashboards([newDashboard, ...savedDashboards]);
            setActiveDashboardId(newDashboard.id);
        }
        setIsSaveModalOpen(false);
    };

    const handleSelectDashboard = (dashboardId: string) => {
        const dashboard = savedDashboards.find(d => d.id === dashboardId);
        if (dashboard) {
            setActiveDashboardId(dashboard.id);
            currentDataRef.current = dashboard.data;
            setCurrentAnalysis(dashboard.analysis);
            setCurrentFileName(dashboard.name);
            setStatus('complete');
            setCurrentView('dashboard');
            if (window.innerWidth < 768) setIsSidebarOpen(false);
            mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleOpenRenameModal = (dashboard: SavedDashboard) => { setDashboardToManage(dashboard); setIsRenameModalOpen(true); };
    const handleRenameDashboard = (newName: string) => {
        if (!dashboardToManage) return;
        setSavedDashboards(savedDashboards.map(d => d.id === dashboardToManage.id ? { ...d, name: newName } : d));
        if (activeDashboardId === dashboardToManage.id) setCurrentFileName(newName);
    };
    const handleOpenDeleteModal = (dashboard: SavedDashboard) => { setDashboardToManage(dashboard); setIsDeleteModalOpen(true); };
    const handleDeleteDashboard = () => {
        if (!dashboardToManage) return;
        setSavedDashboards(savedDashboards.filter(d => d.id !== dashboardToManage.id));
        if (activeDashboardId === dashboardToManage.id) handleReset();
    };
    
    // --- UI Handlers & Memoized Values ---

    const handleChartUpdate = (updatedChart: ChartConfig) => {
        if (!currentAnalysis) return;
        setCurrentAnalysis({
            ...currentAnalysis,
            charts: currentAnalysis.charts.map(c => c.id === updatedChart.id ? updatedChart : c)
        });
        if (activeDashboardId) {
             setSavedDashboards(prev => prev.map(d => d.id === activeDashboardId ? { ...d, isUnsaved: true } : d));
        }
    };

    const activeDashboard = useMemo(() => savedDashboards.find(d => d.id === activeDashboardId), [activeDashboardId, savedDashboards]);

    const dateColumn = useMemo(() => {
        const data = currentDataRef.current;
        if (!data || data.length < 5) return null;
        const columns = Object.keys(data[0]);
        return columns.find(col => !isNaN(Date.parse(String(data[4]?.[col])))) || null;
    }, [status]); // Re-calculate when status changes (i.e., when data is loaded)

    const kpiValues = useMemo(() => {
        const data = currentDataRef.current;
        if (!currentAnalysis || !data) return [];
        return currentAnalysis.kpis.map(kpi => {
            let value = 0;
            if (kpi.operation === 'sum') value = data.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0);
            else if (kpi.operation === 'average') value = data.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0) / (data.length || 1);
            else if (kpi.operation === 'count_distinct') value = new Set(data.map(row => row[kpi.column])).size;
            return { ...kpi, displayValue: new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(value) };
        });
    }, [currentAnalysis, status]); // Re-calculate when analysis/data is ready

    const validationTasks = useMemo(() => {
        if (!validationReport) return [];
        const tasks = [
            `Parsed ${validationReport.rowCount.toLocaleString()} rows and ${validationReport.columnCount} columns`,
            'Assessed overall data quality score',
        ];
        if (validationReport.issues.some(i => i.type === 'missing_values')) {
            tasks.push('Checked for missing values');
        }
        if (validationReport.issues.some(i => i.type === 'duplicates')) {
            tasks.push('Scanned for duplicate entries');
        }
        tasks.push('Prepared smart sample for AI analysis');
        return tasks;
    }, [validationReport]);

    // --- Main Render Logic ---
    const renderSaveButton = () => {
        if (activeDashboard) {
            if (activeDashboard.isUnsaved) {
                return <button onClick={() => handleSaveDashboard(activeDashboard.name)} className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center shadow-sm"><Save size={16} className="mr-2" /> Save Changes</button>;
            }
            return <button disabled className="px-4 py-2 text-sm font-medium text-green-800 bg-green-100 rounded-lg flex items-center cursor-default"><Check size={16} className="mr-2" /> Saved</button>;
        }
        return <button onClick={() => setIsSaveModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center shadow-sm"><Save size={16} className="mr-2" /> Save</button>;
    };

    const renderMainContent = () => {
        const data = currentDataRef.current;
        if (status === 'complete' && currentAnalysis && data) {
             const TabButton = ({ view, label }: { view: 'dashboard' | 'data', label: string }) => (
                <button onClick={() => setCurrentView(view)} className={`px-4 py-2 text-sm font-medium rounded-md ${currentView === view ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
            );
            return (
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                         <h2 className="hidden md:block text-2xl font-bold text-slate-900 line-clamp-1">{currentFileName}</h2>
                        <div className="flex items-center space-x-2 w-full justify-end sm:w-auto">
                            <button onClick={() => window.print()} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center"><Download size={16} className="mr-2" /> Export PDF</button>
                            {renderSaveButton()}
                        </div>
                    </div>
                    <div className="mb-6 p-1.5 bg-slate-100 rounded-lg inline-flex items-center space-x-1">
                       <TabButton view="dashboard" label="Dashboard View" />
                       <TabButton view="data" label="Data View" />
                    </div>
                    {currentView === 'dashboard' ? (
                    <>
                        {currentAnalysis.summary?.length > 0 && (
                            <section id="executive-summary" className="mb-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
                                <div className="flex items-center mb-6"><Sparkles className="text-primary-600 mr-3" size={24} /><h2 className="text-2xl font-bold text-slate-900">Executive Summary</h2></div>
                                <ul className="space-y-4">{currentAnalysis.summary.map((p, i) => <li key={i} className="flex items-start"><span className="inline-block w-2 h-2 rounded-full bg-primary-500 mt-2 mr-3 shrink-0" /><p className="text-slate-700 leading-relaxed text-lg">{p}</p></li>)}</ul>
                            </section>
                        )}
                        {kpiValues.length > 0 && (
                            <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">{kpiValues.map((kpi, i) => <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><div><p className="text-sm font-medium text-slate-500 mb-1">{kpi.title}</p><p className="text-3xl font-bold text-slate-900">{kpi.displayValue}</p></div></div>)}</section>
                        )}
                        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                            {currentAnalysis.charts.map((chart) => <div key={chart.id} className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px]"><ChartRenderer config={chart} data={data} dateColumn={dateColumn} onUpdate={handleChartUpdate} /></div>)}
                        </section>
                    </>
                    ) : ( <div className="h-[calc(100vh-280px)]"><DataTable data={data} /></div> )}
                </div>
            );
        }
        if (status === 'validating_tasks') return <TaskValidator title="Finalizing Checks" subtitle="AI is verifying the structure and quality of your file." tasks={validationTasks} onComplete={handleValidationComplete} />;
        if (status === 'validated') return <EmbeddedDataPreview data={data!} report={validationReport!} onConfirm={handleConfirmPreview} onCancel={handleReset} />;
        return <EmbeddedFileUpload onFileSelect={handleFileSelect} isLoading={status === 'parsing' || status === 'analyzing'} progress={progress} error={error} />;
    };

    return (
        <div className="flex h-screen bg-slate-50 relative">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onNewAnalysis={handleReset} savedDashboards={savedDashboards} activeDashboardId={activeDashboardId} onSelectDashboard={handleSelectDashboard} onRename={handleOpenRenameModal} onDelete={handleOpenDeleteModal} userEmail={userEmail} onLogout={onLogout} />
            <div className={`flex-1 transition-all duration-300 md:ml-20 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
                <header className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200">
                    <div className="h-16 flex items-center justify-between px-4">
                        <div className="flex items-center min-w-0">
                            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 mr-2 text-slate-600 hover:text-primary-600"><Menu size={24} /></button>
                            <h2 className="text-lg font-bold text-slate-900 truncate" title={currentFileName || 'New Analysis'}>{status === 'complete' && currentFileName ? currentFileName : 'New Analysis'}</h2>
                        </div>
                    </div>
                </header>
                <main ref={mainContentRef} className="h-full overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>{renderMainContent()}</main>
            </div>
            
            <SaveDashboardModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={handleSaveDashboard} defaultName={currentFileName || 'Untitled Dashboard'} />
            <RenameDashboardModal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} onRename={handleRenameDashboard} currentName={dashboardToManage?.name || ''} />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteDashboard} dashboardName={dashboardToManage?.name || ''} />
        </div>
    );
};