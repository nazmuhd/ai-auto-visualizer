import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AnalysisResult, DataRow, ChartConfig, KpiConfig, LoadingState, DataQualityReport, SavedDashboard } from '../types';
import { ChartRenderer } from './charts/ChartRenderer';
import { Sparkles, Save, Download, DollarSign, Hash, Activity, Check } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { EmbeddedFileUpload } from './EmbeddedFileUpload';
import { DataScanner } from './DataScanner';
import { EmbeddedDataPreview } from './EmbeddedDataPreview';
import { SaveDashboardModal } from './SaveDashboardModal';
import { RenameDashboardModal } from './modals/RenameDashboardModal';
import { DeleteConfirmationModal } from './modals/DeleteConfirmationModal';
import { DataTable } from './DataTable';
import { parseFile, sampleData, validateData } from '../services/dataParser';
import { analyzeData } from '../services/geminiService';

interface Props {
    userEmail: string;
    onLogout: () => void;
}

export const Dashboard: React.FC<Props> = ({ userEmail, onLogout }) => {
    // Core data state for the current, active analysis/dashboard
    const [currentData, setCurrentData] = useState<DataRow[] | null>(null);
    const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
    const [currentFileName, setCurrentFileName] = useState<string | null>(null);
    
    // State for the entire app flow
    const [status, setStatus] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [validationReport, setValidationReport] = useState<DataQualityReport | null>(null);

    // State for managing multiple dashboards
    const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>([]);
    const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);

    // UI state for modals and views
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [dashboardToManage, setDashboardToManage] = useState<SavedDashboard | null>(null);
    const [currentView, setCurrentView] = useState<'dashboard' | 'data'>('dashboard');

    const analysisPromiseRef = useRef<Promise<AnalysisResult> | null>(null);
    const mainContentRef = useRef<HTMLElement>(null);
    
    // --- Data Processing & Analysis Flow ---

    const handleFileSelect = async (file: File) => {
        setStatus('parsing');
        setError(null);
        setActiveDashboardId(null); 
        setCurrentView('dashboard');

        try {
            const parsedData = await parseFile(file);
            setCurrentData(parsedData);
            setCurrentFileName(file.name);
            analysisPromiseRef.current = analyzeData(sampleData(parsedData, 15));
            setStatus('scanning');
        } catch (err: any) {
            setError(err.message || "Error processing file.");
            setStatus('error');
        }
    };

    const handleScanComplete = () => {
        if (currentData) {
            setValidationReport(validateData(currentData));
            setStatus('validated');
        }
    };

    const handleConfirmPreview = async () => {
        if (!currentData) return;
        setStatus('analyzing');
        try {
            const result = await analysisPromiseRef.current!;
            setCurrentAnalysis(result);
            setStatus('complete');
        } catch (err: any) {
             setError(err.message || "Failed to analyze data.");
             setStatus('error');
        } finally {
            analysisPromiseRef.current = null;
        }
    };

    const handleReset = () => {
        setCurrentData(null);
        setCurrentAnalysis(null);
        setActiveDashboardId(null);
        setStatus('idle');
        setError(null);
        setCurrentView('dashboard');
    };
    
    // --- Dashboard Management ---

    const handleSaveDashboard = (name: string) => {
        if (!currentData || !currentAnalysis) return;

        const activeDashboard = savedDashboards.find(d => d.id === activeDashboardId);

        if (activeDashboard) { // This is an update to an existing dashboard
            const updatedDashboards = savedDashboards.map(d => 
                d.id === activeDashboardId 
                ? { ...d, name, data: currentData, analysis: currentAnalysis, isUnsaved: false } 
                : d
            );
            setSavedDashboards(updatedDashboards);
        } else { // This is a new dashboard being saved
            const newDashboard: SavedDashboard = {
                id: new Date().toISOString(),
                name,
                data: currentData,
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
            setCurrentData(dashboard.data);
            setCurrentAnalysis(dashboard.analysis);
            setCurrentFileName(dashboard.name);
            setStatus('complete');
            setCurrentView('dashboard');
            mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleOpenRenameModal = (dashboard: SavedDashboard) => {
        setDashboardToManage(dashboard);
        setIsRenameModalOpen(true);
    };

    const handleRenameDashboard = (newName: string) => {
        if (!dashboardToManage) return;
        setSavedDashboards(savedDashboards.map(d => d.id === dashboardToManage.id ? { ...d, name: newName } : d));
        if (activeDashboardId === dashboardToManage.id) {
            setCurrentFileName(newName);
        }
    };

    const handleOpenDeleteModal = (dashboard: SavedDashboard) => {
        setDashboardToManage(dashboard);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteDashboard = () => {
        if (!dashboardToManage) return;
        setSavedDashboards(savedDashboards.filter(d => d.id !== dashboardToManage.id));
        if (activeDashboardId === dashboardToManage.id) {
            handleReset();
        }
    };
    
    // --- UI Handlers & Memoized Values ---

    const handleChartUpdate = (updatedChart: ChartConfig) => {
        if (!currentAnalysis) return;
        setCurrentAnalysis({
            ...currentAnalysis,
            charts: currentAnalysis.charts.map(c => c.id === updatedChart.id ? updatedChart : c)
        });
        if (activeDashboardId) {
             setSavedDashboards(prev => prev.map(d => 
                d.id === activeDashboardId ? { ...d, isUnsaved: true } : d
            ));
        }
    };

    const activeDashboard = useMemo(() => {
        return savedDashboards.find(d => d.id === activeDashboardId);
    }, [activeDashboardId, savedDashboards]);

    const dateColumn = useMemo(() => {
        if (!currentData || currentData.length < 5) return null;
        const columns = Object.keys(currentData[0]);
        return columns.find(col => !isNaN(Date.parse(String(currentData[4]?.[col])))) || null;
    }, [currentData]);

    const kpiValues = useMemo(() => {
        if (!currentAnalysis || !currentData) return [];
        return currentAnalysis.kpis.map(kpi => {
            let value = 0;
            if (kpi.operation === 'sum') value = currentData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0);
            else if (kpi.operation === 'average') value = currentData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0) / (currentData.length || 1);
            else if (kpi.operation === 'count_distinct') value = new Set(currentData.map(row => row[kpi.column])).size;
            return { ...kpi, displayValue: new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(value) };
        });
    }, [currentData, currentAnalysis]);

    // --- Main Render Logic ---
    const renderSaveButton = () => {
        if (activeDashboard) {
            if (activeDashboard.isUnsaved) {
                return (
                    <button onClick={() => handleSaveDashboard(activeDashboard.name)} className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center shadow-sm">
                        <Save size={16} className="mr-2" /> Save Changes
                    </button>
                );
            }
            return (
                <button disabled className="px-4 py-2 text-sm font-medium text-green-800 bg-green-100 rounded-lg flex items-center cursor-default">
                    <Check size={16} className="mr-2" /> Saved
                </button>
            );
        }
        return (
            <button onClick={() => setIsSaveModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center shadow-sm">
                <Save size={16} className="mr-2" /> Save
            </button>
        );
    };

    const renderMainContent = () => {
        if (status === 'complete' && currentAnalysis && currentData) {
             const TabButton = ({ view, label }: { view: 'dashboard' | 'data', label: string }) => (
                <button 
                    onClick={() => setCurrentView(view)}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${currentView === view ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    {label}
                </button>
            );
            return (
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">{currentFileName}</h2>
                        <div className="flex items-center space-x-2">
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
                            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">{kpiValues.map((kpi, i) => <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><div><p className="text-sm font-medium text-slate-500 mb-1">{kpi.title}</p><p className="text-3xl font-bold text-slate-900">{kpi.displayValue}</p></div></div>)}</section>
                        )}
                        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                            {currentAnalysis.charts.map((chart) => <div key={chart.id} className="h-[450px]"><ChartRenderer config={chart} data={currentData} dateColumn={dateColumn} onUpdate={handleChartUpdate} /></div>)}
                        </section>
                    </>
                    ) : ( <div className="h-[calc(100vh-280px)]"><DataTable data={currentData} /></div> )}
                </div>
            );
        }
        if (status === 'scanning') return <DataScanner onComplete={handleScanComplete} />;
        if (status === 'validated') return <EmbeddedDataPreview data={currentData!} report={validationReport!} onConfirm={handleConfirmPreview} onCancel={handleReset} />;
        return <EmbeddedFileUpload onFileSelect={handleFileSelect} isLoading={status === 'parsing' || status === 'analyzing'} error={error} />;
    };

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen}
                onNewAnalysis={handleReset}
                savedDashboards={savedDashboards}
                activeDashboardId={activeDashboardId}
                onSelectDashboard={handleSelectDashboard}
                onRename={handleOpenRenameModal}
                onDelete={handleOpenDeleteModal}
                userEmail={userEmail}
                onLogout={onLogout}
            />
            <main ref={mainContentRef} className="flex-1 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
                {renderMainContent()}
            </main>
            
            <SaveDashboardModal 
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)} 
                onSave={handleSaveDashboard} 
                defaultName={currentFileName || 'Untitled Dashboard'} 
            />
            <RenameDashboardModal 
                isOpen={isRenameModalOpen}
                onClose={() => setIsRenameModalOpen(false)}
                onRename={handleRenameDashboard}
                currentName={dashboardToManage?.name || ''}
            />
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteDashboard}
                dashboardName={dashboardToManage?.name || ''}
            />
        </div>
    );
};