
import React, { useMemo, useCallback, useRef, useState } from 'react';
import { Menu, AlertTriangle, XCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Stores
import { useProjectStore } from '../store/projectStore.ts';
import { useUIStore } from '../store/uiStore.ts';

// Hooks
import { useDataProcessing, useGemini } from '../hooks/index.ts';

// Types
import { ReportTemplate } from '../types.ts';

// Components
import { Sidebar } from './Sidebar.tsx';
import { GetStartedHub } from './GetStartedHub.tsx';
import { EmbeddedDataPreview } from './EmbeddedDataPreview.tsx';
import { PresentationView } from './PresentationView.tsx';
import { LoadingSkeleton } from './ui/LoadingSkeleton.tsx';
import { DashboardWorkspace, ProjectEmptyState } from '../features/dashboard/index.ts';

interface DashboardProps {
    userEmail: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ userEmail }) => {
    // --- Store Access ---
    const { projects, activeProjectId, createProject, setActiveProject, updateActiveProject, saveStatus, renameProject, deleteProject, saveProject } = useProjectStore();
    const { isSidebarOpen, setSidebarOpen, openModal, closeModal, globalFilters, timeFilter, setGlobalFilters, setTimeFilter } = useUIStore();
    
    const activeProject = projects.find(p => p.id === activeProjectId) || null;

    // --- Hooks Integration ---
    const { processFile, isProcessing, progress, report: validationReport, error: processError, resetProcessing } = useDataProcessing();
    const { analyzeData, generatePresentation, isAnalyzing, analysisProgress, analysisError, resetGemini } = useGemini();

    const mainContentRef = useRef<HTMLElement>(null);
    const [hasConfirmedPreview, setHasConfirmedPreview] = useState(false);
    const [editingPresentationId, setEditingPresentationId] = useState<string | null>(null);
    const [presentingPresentationId, setPresentingPresentationId] = useState<string | null>(null);
    const [dashboardLayout, setDashboardLayout] = useState('2-2-2');

    // --- Computed Logic ---
    const dateColumn = useMemo(() => {
        const data = activeProject?.dataSource.data;
        if (!data || data.length < 5) return null;
        const columns = Object.keys(data[0]);
        return columns.find(col => !isNaN(Date.parse(String(data[4]?.[col])))) || null;
    }, [activeProject?.dataSource.data]);

    const filteredData = useMemo(() => {
        if (!activeProject) return [];
        let result = activeProject.dataSource.data;
        
        // Apply Global Filters
        Object.entries(globalFilters).forEach(([col, allowedValues]: [string, Set<string>]) => {
            if (allowedValues.size > 0) {
                result = result.filter((row: any) => allowedValues.has(String(row[col])));
            }
        });
        
        // Apply Time Filter (Basic implementation)
        if (dateColumn && timeFilter.type !== 'all') {
             // ... (Time filtering logic would go here, simplified for brevity)
        }
        
        return result;
    }, [activeProject, globalFilters, timeFilter, dateColumn]);

    // --- Handlers ---
    
    const handleFileSelect = useCallback(async (file: File) => {
        const result = await processFile(file);
        if (result) {
             if (activeProject && activeProject.dataSource.data.length === 0) {
                 updateActiveProject(p => { p.dataSource = { name: file.name, data: result.data }; });
             } else {
                 const newProj = createProject(file.name, ''); // Creates and sets active
                 // We need to wait for state update or use the returned instance, but createProject handles setting active.
                 // However, we need to update the DATA on that new project.
                 setTimeout(() => {
                     updateActiveProject(p => { p.dataSource = { name: file.name, data: result.data }; });
                 }, 0);
             }
             setHasConfirmedPreview(false);
        }
    }, [activeProject, processFile, updateActiveProject, createProject]);

    const handleConfirmPreview = useCallback(async () => {
        if (!activeProject) return;
        const sample = activeProject.dataSource.data.slice(0, 50);
        const result = await analyzeData(sample);
        
        if (result) {
            updateActiveProject(p => {
                p.analysis = { 
                    ...result, 
                    charts: result.charts.map((c, i) => ({ ...c, visible: i < 6 })), 
                    kpis: result.kpis.map((k, i) => ({ ...k, visible: i < 5 })) 
                };
            });
            setHasConfirmedPreview(true);
        }
    }, [activeProject, analyzeData, updateActiveProject]);

    const handleReset = useCallback(() => {
        setActiveProject(null);
        resetProcessing();
        resetGemini();
        setHasConfirmedPreview(false);
    }, [setActiveProject, resetProcessing, resetGemini]);

    // --- Dashboard Handlers ---
    const handleChartVisibilityToggle = useCallback((chartId: string) => {
        updateActiveProject(p => {
            if (p.analysis) {
                const chart = p.analysis.charts.find(c => c.id === chartId);
                if (chart) chart.visible = !chart.visible;
            }
        });
    }, [updateActiveProject]);

    const handleKpiVisibilityToggle = useCallback((kpiId: string) => {
        updateActiveProject(p => {
            if (p.analysis) {
                const kpi = p.analysis.kpis.find(k => k.id === kpiId);
                if (kpi) kpi.visible = !kpi.visible;
            }
        });
    }, [updateActiveProject]);

    const handleAddCustomKpi = useCallback((newKpi: any) => {
         updateActiveProject(p => {
            if (p.analysis) {
                p.analysis.kpis.push({ ...newKpi, id: uuidv4(), visible: true });
            }
        });
    }, [updateActiveProject]);

    // --- Report Handlers ---
    const handleReportTemplateSelect = useCallback(async (template: ReportTemplate) => {
        closeModal();
        if (!activeProject || !activeProject.analysis) return;

        // Use the existing generatePresentation function from the hook
        // This triggers the isAnalyzing state which shows the LoadingSkeleton
        const presentation = await generatePresentation(activeProject.analysis, template, activeProject.name);
        
        if (presentation) {
            updateActiveProject(p => {
                if (!p.presentations) p.presentations = [];
                p.presentations.push(presentation);
            });
            setEditingPresentationId(presentation.id);
        }
    }, [activeProject, generatePresentation, updateActiveProject, closeModal]);

    // --- Render Logic ---

    const renderMainContent = () => {
        if (isProcessing) return <LoadingSkeleton mode="parsing" status={progress?.status} progress={progress?.percentage} />;
        if (isAnalyzing) return <LoadingSkeleton mode="report" status={analysisProgress?.status} progress={analysisProgress?.percentage} />;

        // AI Error Handling
        if (analysisError) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-red-50/50">
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 max-w-md">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">AI Analysis Failed</h3>
                        <p className="text-slate-600 mb-6">{analysisError}</p>
                        <div className="flex justify-center space-x-3">
                            <button onClick={resetGemini} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Dismiss</button>
                            <button onClick={handleConfirmPreview} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm">Try Again</button>
                        </div>
                    </div>
                </div>
            );
        }

        if (!activeProject) {
            return (
                <div className="h-full overflow-y-auto">
                    <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => openModal('createProject', { onSave: createProject })} isLoading={false} error={null} progress={null} />
                </div>
            );
        }

        if (activeProject.dataSource.data.length === 0) {
            return (
                <div className="h-full overflow-y-auto">
                    <ProjectEmptyState project={activeProject} onFileSelect={handleFileSelect} onRename={() => openModal('renameProject', { currentName: activeProject.name, onSave: (n: string, d: string) => renameProject(activeProject.id, n, d) })} />
                </div>
            );
        }

        if (validationReport && !hasConfirmedPreview) {
            return (
                <div className="h-full overflow-y-auto">
                    <EmbeddedDataPreview data={activeProject.dataSource.data} report={validationReport} onConfirm={handleConfirmPreview} onCancel={handleReset} />
                </div>
            );
        }

        if (activeProject.analysis) {
            return <DashboardWorkspace 
                project={activeProject}
                filteredData={filteredData}
                onOpenEditModal={() => openModal('dashboardSettings', {
                    onChartVisibilityToggle: handleChartVisibilityToggle,
                    onKpiVisibilityToggle: handleKpiVisibilityToggle,
                    onAddCustomKpi: handleAddCustomKpi,
                    dashboardLayout
                })}
                setIsLayoutModalOpen={() => openModal('layoutSelection', { 
                    currentLayout: dashboardLayout, 
                    onSelectLayout: (layoutId: string) => {
                        setDashboardLayout(layoutId);
                        closeModal();
                    }
                })}
                onCreateReport={() => openModal('reportTemplate', { onSelect: handleReportTemplateSelect })}
                onSelectPresentation={setEditingPresentationId}
                onRenamePresentation={(id) => { /* TODO: Implement rename */ }}
                onDuplicatePresentation={(id) => { /* TODO: Implement duplicate */ }}
                onDeletePresentation={(p) => {
                    updateActiveProject(prev => { prev.presentations = prev.presentations?.filter(pr => pr.id !== p.id); });
                }}
                dashboardLayout={dashboardLayout}
                dateColumn={dateColumn}
                onChartUpdate={(c) => updateActiveProject(p => { if(p.analysis) p.analysis.charts = p.analysis.charts.map(ch => ch.id === c.id ? c : ch); })}
                onSetMaximizedChart={(c) => c && openModal('chartMaximize', { 
                    config: c, 
                    data: filteredData, 
                    allData: activeProject.dataSource.data,
                    dateColumn,
                    onUpdate: (newConfig: any) => updateActiveProject(p => { if(p.analysis) p.analysis.charts = p.analysis.charts.map(ch => ch.id === newConfig.id ? newConfig : ch); }),
                    onFilterChange: (c: string, v: Set<string>) => setGlobalFilters({...globalFilters, [c]: v}),
                    onTimeFilterChange: (f: any) => setTimeFilter(f),
                    activeFilters: globalFilters,
                    activeTimeFilter: timeFilter
                })}
                saveStatus={saveStatus}
                onManualSave={() => saveProject(activeProject.name, activeProject.description)}
                globalFilters={globalFilters}
                timeFilter={timeFilter as any}
                onGlobalFilterChange={(c, v) => setGlobalFilters({...globalFilters, [c]: v})}
                onTimeFilterChange={(f) => setTimeFilter(f as any)}
                onRemoveFilter={(c, v) => {
                    const newFilters = { ...globalFilters };
                    if (c === '__all__') {
                        setGlobalFilters({});
                        return;
                    }
                    if (v && newFilters[c]) {
                        newFilters[c].delete(v);
                        if (newFilters[c].size === 0) delete newFilters[c];
                    } else {
                        delete newFilters[c];
                    }
                    setGlobalFilters(newFilters);
                }}
                onKpiClick={(k) => openModal('kpiDetail', { kpi: k })}
                onProjectUpdate={updateActiveProject}
                editingPresentationId={editingPresentationId}
                onBackToHub={() => setEditingPresentationId(null)}
                onPresentationUpdate={(updatedPres) => updateActiveProject(p => {
                    if(p.presentations) p.presentations = p.presentations.map(pr => pr.id === updatedPres.id ? updatedPres : pr);
                })}
                onPresent={setPresentingPresentationId}
            />;
        }

        return <div className="p-8">Error State or Fallback</div>;
    };

    // Safe access to presentation for viewer
    const currentPresentation = presentingPresentationId && activeProject?.presentations 
        ? activeProject.presentations.find(p => p.id === presentingPresentationId) 
        : null;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setSidebarOpen} 
                onNewProject={handleReset} 
                savedProjects={projects} 
                activeProjectId={activeProjectId} 
                onSelectProject={setActiveProject} 
                onRename={(p) => openModal('renameProject', { currentName: p.name, onSave: (n: string, d: string) => renameProject(p.id, n, d) })} 
                onDelete={(p) => openModal('deleteProject', { projectName: p.name, onConfirm: () => deleteProject(p.id) })} 
                userEmail={userEmail} 
            />
            <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
                <header className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200 h-16 flex items-center px-4 flex-shrink-0">
                    <button onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
                </header>
                <main ref={mainContentRef} className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                    {renderMainContent()}
                </main>
            </div>
            {currentPresentation && activeProject && (
                <PresentationView 
                    project={activeProject} 
                    presentation={currentPresentation} 
                    onClose={() => setPresentingPresentationId(null)} 
                />
            )}
        </div>
    );
};
