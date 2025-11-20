
import React, { useMemo, useState, useCallback, useRef } from 'react';
import { ChartConfig, KpiConfig, LayoutInfo, Presentation, ReportTemplate } from '../types.ts';
import { TimeFilterPreset } from './charts/ChartRenderer.tsx';
import { Menu } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Components
import { Sidebar } from './Sidebar.tsx';
import { GetStartedHub } from './GetStartedHub.tsx';
import { EmbeddedDataPreview } from './EmbeddedDataPreview.tsx';
import { PresentationView } from './PresentationView.tsx';
import { LoadingSkeleton } from './ui/LoadingSkeleton.tsx';

// Feature Components
import { DashboardWorkspace, ProjectEmptyState } from '../features/dashboard/index.ts';

// Modals
import { CreateProjectModal } from './modals/CreateProjectModal.tsx';
import { SaveProjectModal } from './modals/SaveProjectModal.tsx';
import { RenameProjectModal } from './modals/RenameProjectModal.tsx';
import { DeleteConfirmationModal } from './modals/DeleteConfirmationModal.tsx';

// Feature Specific Modals
import { ChartMaximizeModal } from '../features/dashboard/components/modals/ChartMaximizeModal.tsx';
import { LayoutSelectionModal } from '../features/dashboard/components/modals/LayoutSelectionModal.tsx';
import { DashboardSettingsModal } from '../features/dashboard/components/modals/DashboardSettingsModal.tsx';
import { KpiDetailModal } from '../features/dashboard/components/modals/KpiDetailModal.tsx';
import { ReportTemplateSelectionModal } from '../features/report-studio/components/modals/ReportTemplateSelectionModal.tsx';

// Pages
import { SettingsPage } from './pages/SettingsPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';

// Hooks
import { useResponsiveSidebar, useProjects, useDataProcessing, useGemini } from '../hooks/index.ts';

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

export const Dashboard: React.FC<DashboardProps> = ({ userEmail, onLogout }) => {
    // --- Hooks Integration ---
    const [isSidebarOpen, setIsSidebarOpen] = useResponsiveSidebar();
    const { 
        savedProjects, activeProject, saveStatus, createProject, saveProject, manualSave, 
        selectProject, deleteProject, renameProject, resetActiveProject, updateActiveProject, setActiveProject 
    } = useProjects();
    
    const { 
        processFile, isProcessing, progress, report: validationReport, error: processError, 
        resetProcessing 
    } = useDataProcessing();
    
    const { 
        analyzeData, generatePresentation, isAnalyzing, analysisProgress, analysisError, resetGemini 
    } = useGemini();

    // --- Local UI State ---
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToManage, setProjectToManage] = useState<any | null>(null);
    const [presentationToDelete, setPresentationToDelete] = useState<Presentation | null>(null);

    const [editingPresentationId, setEditingPresentationId] = useState<string | null>(null);
    const [presentingPresentationId, setPresentingPresentationId] = useState<string | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false); 

    const [maximizedChart, setMaximizedChart] = useState<ChartConfig | null>(null);
    const [selectedKpi, setSelectedKpi] = useState<KpiConfig | null>(null);
    const [dashboardLayout, setDashboardLayout] = useState<string>('2-2-2');
    const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isReportTemplateModalOpen, setIsReportTemplateModalOpen] = useState(false);
    
    const [globalFilters, setGlobalFilters] = useState<Record<string, Set<string>>>({});
    const [timeFilter, setTimeFilter] = useState<{ type: TimeFilterPreset; start?: string; end?: string }>({ type: 'all' });

    const [mainView, setMainView] = useState<'dashboard' | 'settings' | 'account'>('dashboard');
    const [hasConfirmedPreview, setHasConfirmedPreview] = useState(false);

    const mainContentRef = useRef<HTMLElement>(null);
    
    // --- Computed ---
    const dateColumn = useMemo(() => {
        if (!activeProject || !activeProject.dataSource) return null;
        const data = activeProject.dataSource.data;
        if (!data || data.length < 5) return null;
        const columns = Object.keys(data[0]);
        return columns.find(col => !isNaN(Date.parse(String(data[4]?.[col])))) || null;
    }, [activeProject]);

    const filteredData = useMemo(() => {
        if (!activeProject || !activeProject.dataSource) return [];
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

            result = result.filter((row: any) => {
                const rowDateValue = row[dateColumn!];
                if (!rowDateValue) return false;
                const rowDate = new Date(rowDateValue);
                if (isNaN(rowDate.getTime())) return false;
                if (startDate && rowDate < startDate) return false;
                if (endDate && rowDate > endDate) return false;
                return true;
            });
        }
        
        Object.entries(globalFilters).forEach(([col, allowedValues]: [string, Set<string>]) => {
            if (allowedValues.size > 0) {
                result = result.filter((row: any) => allowedValues.has(String(row[col])));
            }
        });
        return result;
    }, [activeProject, globalFilters, timeFilter, dateColumn]);

    // --- Handlers ---
    
    const handleFileSelect = useCallback(async (file: File) => {
        const result = await processFile(file);
        if (result) {
             if (activeProject && activeProject.dataSource && activeProject.dataSource.data.length === 0) {
                 updateActiveProject((p: any) => ({ ...p, dataSource: { name: file.name, data: result.data } }));
             } else {
                 // New temporary project
                 const newProject = {
                    id: `unsaved_${Date.now()}`, name: file.name, description: '', createdAt: new Date(),
                    dataSource: { name: file.name, data: result.data }, analysis: null,
                 };
                 setActiveProject(newProject as any);
             }
             setHasConfirmedPreview(false); 
        }
    }, [activeProject, processFile, updateActiveProject, setActiveProject]);

    const handleConfirmPreview = useCallback(async () => {
        if (!activeProject) return;
        const sample = activeProject.dataSource.data.slice(0, 50);
        const result = await analyzeData(sample);
        
        if (result) {
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
            
            updateActiveProject((p: any) => ({ ...p, analysis: { ...result, charts: chartsWithVisibility, kpis: initialKpis } }));
            setHasConfirmedPreview(true);
            
            if (activeProject.id.startsWith('unsaved_')) {
                 setIsSaveModalOpen(true);
            }
        }
    }, [activeProject, dashboardLayout, analyzeData, updateActiveProject]);

    const handleReset = useCallback(() => {
        resetActiveProject();
        resetProcessing();
        resetGemini();
        setHasConfirmedPreview(false);
        setEditingPresentationId(null);
        setPresentingPresentationId(null);
        setGlobalFilters({});
        setTimeFilter({type:'all'});
        setIsSettingsModalOpen(false);
        setMainView('dashboard');
        setIsGeneratingReport(false);
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
    }, [resetActiveProject, resetProcessing, resetGemini, setIsSidebarOpen]);
    
    const handleCreateProject = useCallback((name: string, description: string) => {
        createProject(name, description);
        setIsCreateModalOpen(false);
        setMainView('dashboard');
        resetProcessing();
        setHasConfirmedPreview(false);
    }, [createProject, resetProcessing]);

    const handleSaveProject = useCallback((name: string, description: string) => {
        saveProject(name, description);
        setIsSaveModalOpen(false);
    }, [saveProject]);

    const handleSelectProject = useCallback((projectId: string) => {
        selectProject(projectId);
        setEditingPresentationId(null);
        setPresentingPresentationId(null);
        setGlobalFilters({});
        setTimeFilter({ type: 'all' });
        setIsSettingsModalOpen(false);
        setMainView('dashboard');
        setIsGeneratingReport(false);
        setHasConfirmedPreview(true); // Loaded projects are already confirmed
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
        mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [selectProject, setIsSidebarOpen]);
    
    const handleOpenRenameModal = useCallback((project: any) => { setProjectToManage(project); setIsRenameModalOpen(true); }, []);
    const handleRenameProject = useCallback((name: string, description: string) => { if (projectToManage) renameProject(projectToManage, name, description); }, [projectToManage, renameProject]);

    const handleOpenDeleteModal = useCallback((project: any) => { setProjectToManage(project); setIsDeleteModalOpen(true); }, []);
    const handleDeleteProject = useCallback(() => { if (projectToManage) { deleteProject(projectToManage); if (activeProject?.id === projectToManage.id) handleReset(); } }, [projectToManage, deleteProject, activeProject, handleReset]);
    
    const handleChartUpdate = useCallback((updatedChart: ChartConfig) => {
        updateActiveProject((p: any) => {
            if (!p.analysis) return p;
            const updatedAnalysis = { ...p.analysis, charts: p.analysis.charts.map((c: any) => c.id === updatedChart.id ? updatedChart : c) };
            if (maximizedChart && maximizedChart.id === updatedChart.id) setMaximizedChart(updatedChart);
            return { ...p, analysis: updatedAnalysis };
        });
    }, [maximizedChart, updateActiveProject]);

    const handleSelectLayout = useCallback((layoutId: string) => {
        setDashboardLayout(layoutId);
        setIsLayoutModalOpen(false);
        updateActiveProject((p: any) => {
            if (!p.analysis) return p;
            const newLayout = layouts.find(l => l.id === layoutId) || layouts[0];
            const maxCharts = newLayout.totalCharts;
            let visibleCount = 0;
            const updatedCharts = p.analysis.charts.map((chart: any) => {
                const shouldBeVisible = chart.visible && visibleCount < maxCharts;
                if (shouldBeVisible) visibleCount++;
                return { ...chart, visible: shouldBeVisible };
            });
            if (visibleCount < maxCharts) {
                for (let chart of updatedCharts) {
                    if (visibleCount >= maxCharts) break;
                    if (!chart.visible) { chart.visible = true; visibleCount++; }
                }
            }
            return { ...p, analysis: { ...p.analysis, charts: updatedCharts } };
        });
    }, [updateActiveProject]);
    
    const handleKpiVisibilityToggle = useCallback((kpiId: string) => {
        updateActiveProject((p: any) => {
            if (!p.analysis) return p;
            return { ...p, analysis: { ...p.analysis, kpis: p.analysis.kpis.map((kpi: any) => kpi.id === kpiId ? { ...kpi, visible: !kpi.visible } : kpi) } };
        });
    }, [updateActiveProject]);

    const handleAddCustomKpi = useCallback((newKpi: Omit<KpiConfig, 'id'>) => {
        updateActiveProject((p: any) => {
            if (!p.analysis) return p;
            return { ...p, analysis: { ...p.analysis, kpis: [...p.analysis.kpis, { ...newKpi, id: `custom_${Date.now()}`, visible: true }] } };
        });
    }, [updateActiveProject]);
    
    const handleChartVisibilityToggle = useCallback((chartId: string) => {
        if (!activeProject?.analysis) return;
        const targetChart = activeProject.analysis.charts.find((c: any) => c.id === chartId);
        const layout = layouts.find(l => l.id === dashboardLayout) || layouts[0];
        const currentVisibleCount = activeProject.analysis.charts.filter((c: any) => c.visible).length;

        if (!targetChart?.visible && currentVisibleCount >= layout.totalCharts) {
            alert(`This layout supports a maximum of ${layout.totalCharts} charts.`);
            return;
        }

        updateActiveProject((p: any) => ({ ...p, analysis: { ...p.analysis, charts: p.analysis.charts.map((chart: any) => chart.id === chartId ? { ...chart, visible: !chart.visible } : chart) } }));
    }, [activeProject, dashboardLayout, updateActiveProject]);
    
    const handleGlobalFilterChange = useCallback((column: string, values: Set<string>) => {
        setGlobalFilters(prev => {
            if(column === '__clear__') return {};
            const newFilters = { ...prev };
            if (values.size === 0) delete newFilters[column];
            else newFilters[column] = values;
            return newFilters;
        });
    }, []);

    const handleRemoveFilter = useCallback((column: string, value?: string) => {
        if (column === '__all__') { setGlobalFilters({}); return; }
        setGlobalFilters(prev => {
            const newFilters = { ...prev };
            if (value && newFilters[column]) {
                const newSet = new Set(newFilters[column]);
                newSet.delete(value);
                if (newSet.size === 0) delete newFilters[column];
                else newFilters[column] = newSet;
            } else delete newFilters[column];
            return newFilters;
        });
    }, []);
    
    const handleKpiClick = useCallback((kpi: KpiConfig) => {
        if (kpi.primaryCategory && kpi.primaryCategoryValue) {
            setGlobalFilters(prev => {
                const currentSet = prev[kpi.primaryCategory!] || new Set<string>();
                const newSet = new Set(currentSet);
                if (newSet.has(kpi.primaryCategoryValue!) && newSet.size === 1) newSet.delete(kpi.primaryCategoryValue!);
                else { newSet.clear(); newSet.add(kpi.primaryCategoryValue!); }
                
                const newFilters = { ...prev };
                if (newSet.size === 0) delete newFilters[kpi.primaryCategory!];
                else newFilters[kpi.primaryCategory!] = newSet;
                return newFilters;
            });
        } else setSelectedKpi(kpi);
    }, []);
    
    const handleTemplateSelected = async (template: ReportTemplate) => {
        if (!activeProject || !activeProject.analysis) return;
        setIsReportTemplateModalOpen(false);
        setIsGeneratingReport(true); // START LOADING
        
        try {
             const pres = await generatePresentation(activeProject.analysis!, template, activeProject.name);
             if (pres) {
                 updateActiveProject((p: any) => ({ ...p, presentations: [...(p.presentations || []), pres] }));
                 setEditingPresentationId(pres.id);
             }
        } catch (e) {
            console.error(e);
            alert("Failed to generate presentation. Please try again.");
        } finally {
            setIsGeneratingReport(false); // STOP LOADING
        }
    };
    
    const handlePresentationUpdate = useCallback((updatedPresentation: Presentation) => {
        updateActiveProject((p: any) => p ? ({ ...p, presentations: p.presentations ? p.presentations.map((pres: any) => pres.id === updatedPresentation.id ? updatedPresentation : pres) : [updatedPresentation] }) : p);
    }, [updateActiveProject]);

    const handleRenamePresentation = useCallback((presId: string) => {
        updateActiveProject((p: any) => {
            if (!p || !p.presentations) return p;
            const pres = p.presentations.find((pr: any) => pr.id === presId);
            const newName = prompt("Enter new presentation name:", pres?.name);
            if (newName && newName.trim()) {
                return { ...p, presentations: p.presentations.map((pr: any) => pr.id === presId ? { ...pr, name: newName.trim() } : pr) };
            }
            return p;
        });
    }, [updateActiveProject]);

    const handleDuplicatePresentation = useCallback((presId: string) => {
        updateActiveProject((p: any) => {
            if (!p || !p.presentations) return p;
            const original = p.presentations.find((pr: any) => pr.id === presId);
            if (!original) return p;

            const idMapping = new Map<string, string>();
            const sourceBlocks = original.blocks || [];
            const newBlocks = sourceBlocks.map((b: any) => {
                const newId = `${b.id.split('_')[0]}_${uuidv4()}`;
                idMapping.set(b.id, newId);
                return { ...b, id: newId };
            });

            const newSlides = original.slides.map((slide: any) => ({
                ...slide,
                id: `slide_${uuidv4()}`,
                layout: slide.layout.map((item: any) => {
                    const mappedId = idMapping.get(item.i);
                    return mappedId ? { ...item, i: mappedId } : item;
                })
            }));

            const newPresentation = {
                ...original,
                id: `pres_${uuidv4()}`,
                name: `${original.name} (Copy)`,
                slides: newSlides,
                blocks: newBlocks,
            };

            return { ...p, presentations: [...p.presentations, newPresentation] };
        });
    }, [updateActiveProject]);

    const handleOpenDeletePresModal = (presentation: Presentation) => {
        setPresentationToDelete(presentation);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDeletePresentation = () => {
        if (!presentationToDelete) return;
        updateActiveProject((p: any) => ({ ...p, presentations: p.presentations?.filter((pr: any) => pr.id !== presentationToDelete.id) }));
        setPresentationToDelete(null);
    };

    // --- Render Logic ---
    
    const renderMainContent = () => {
        if (mainView === 'settings') return <SettingsPage />;
        if (mainView === 'account') return <AccountPage userEmail={userEmail} onLogout={onLogout} />;

        // 1. CSV Parsing Loading State
        if (isProcessing) {
            return <LoadingSkeleton mode="parsing" status={progress?.status} progress={progress?.percentage} />;
        }

        // 2. Dashboard Analysis Loading State
        if (isAnalyzing && !isGeneratingReport) {
             return <LoadingSkeleton mode="dashboard" status={analysisProgress?.status || "Analyzing data..."} progress={analysisProgress?.percentage} />;
        }

        // 3. Report Generation Loading State
        if (isGeneratingReport) {
            return <LoadingSkeleton mode="report" status={analysisProgress?.status || "Drafting presentation..."} progress={analysisProgress?.percentage} />;
        }

        if (!activeProject) {
             return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={false} progress={null} error={null} />;
        }
        
        if (activeProject.dataSource.data.length === 0) {
             return <ProjectEmptyState project={activeProject} onFileSelect={handleFileSelect} onRename={() => handleOpenRenameModal(activeProject)} />;
        }

        if (validationReport && !hasConfirmedPreview) {
             return <EmbeddedDataPreview data={activeProject.dataSource.data} report={validationReport} onConfirm={handleConfirmPreview} onCancel={handleReset} />;
        }
        
        if (activeProject.analysis) {
            return <DashboardWorkspace
                project={activeProject}
                filteredData={filteredData}
                onOpenEditModal={() => setIsSettingsModalOpen(true)}
                setIsLayoutModalOpen={setIsLayoutModalOpen}
                onCreateReport={() => setIsReportTemplateModalOpen(true)}
                onSelectPresentation={setEditingPresentationId}
                onRenamePresentation={handleRenamePresentation}
                onDuplicatePresentation={handleDuplicatePresentation}
                onDeletePresentation={handleOpenDeletePresModal}
                dashboardLayout={dashboardLayout}
                dateColumn={dateColumn}
                onChartUpdate={handleChartUpdate}
                onSetMaximizedChart={setMaximizedChart}
                saveStatus={saveStatus}
                onManualSave={manualSave}
                globalFilters={globalFilters}
                timeFilter={timeFilter}
                onGlobalFilterChange={handleGlobalFilterChange}
                onTimeFilterChange={(filter) => setTimeFilter(filter)}
                onRemoveFilter={handleRemoveFilter}
                onKpiClick={handleKpiClick}
                onProjectUpdate={updateActiveProject}
                editingPresentationId={editingPresentationId}
                onBackToHub={() => setEditingPresentationId(null)}
                onPresentationUpdate={handlePresentationUpdate}
                onPresent={setPresentingPresentationId}
            />;
        }
        
        if (analysisError || processError) {
             return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={false} progress={null} error={analysisError || processError || 'An error occurred.'} />;
        }

        // Default fallback
        return <GetStartedHub onAnalyzeFile={handleFileSelect} onCreateProject={() => setIsCreateModalOpen(true)} isLoading={false} progress={null} error={null} />;
    };

    const presentationToPresent = activeProject?.presentations?.find((p: any) => p.id === presentingPresentationId);
    const isEditingOrPresenting = !!editingPresentationId || !!presentingPresentationId;

    return (
        <div className="flex h-screen bg-slate-50">
            {!isEditingOrPresenting && (
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
            )}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${!isEditingOrPresenting ? (isSidebarOpen ? 'md:ml-64' : 'md:ml-20') : 'md:ml-0'}`}>
                {!isEditingOrPresenting && (
                    <header className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200">
                        <div className="h-16 flex items-center justify-between px-4">
                            <div className="flex items-center min-w-0">
                                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 mr-2 text-slate-600 hover:text-primary-600">
                                    <Menu size={24} />
                                </button>
                                <h2 className="text-lg font-bold text-slate-900 truncate" title={activeProject?.name || 'New Project'}>
                                    {activeProject?.name || 'New Project'}
                                </h2>
                            </div>
                        </div>
                    </header>
                )}
                <main ref={mainContentRef} className={`flex-1 ${isEditingOrPresenting ? 'overflow-hidden flex flex-col' : 'overflow-y-auto custom-scrollbar'}`}>
                    {renderMainContent()}
                </main>
            </div>
            
            {presentingPresentationId && activeProject && presentationToPresent && (
                <PresentationView 
                    project={activeProject} 
                    presentation={presentationToPresent} 
                    onClose={() => setPresentingPresentationId(null)} 
                />
            )}

            <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleCreateProject} />
            <SaveProjectModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={handleSaveProject} defaultName={activeProject?.name || 'Untitled Project'} />
            <RenameProjectModal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} onSave={handleRenameProject} currentName={projectToManage?.name || ''} currentDescription={projectToManage?.description || ''} />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen && !!projectToManage} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteProject} projectName={projectToManage?.name || ''} />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen && !!presentationToDelete} onClose={() => { setIsDeleteModalOpen(false); setPresentationToDelete(null); }} onConfirm={handleConfirmDeletePresentation} projectName={presentationToDelete?.name || ''} />
            
            {maximizedChart && activeProject && <ChartMaximizeModal 
                config={maximizedChart} 
                data={filteredData} 
                allData={activeProject.dataSource.data}
                dateColumn={dateColumn} 
                onUpdate={handleChartUpdate} 
                onClose={() => setMaximizedChart(null)}
                onFilterChange={handleGlobalFilterChange}
                onTimeFilterChange={(filter) => setTimeFilter(filter)}
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
