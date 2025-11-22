
import React, { useState, useMemo, useEffect } from 'react';
import { Project, ChartConfig, KpiConfig, Presentation, SaveStatus } from '../../types.ts';
import { TimeFilterPreset } from '../../components/charts/ChartRenderer.tsx';
import { BarChart3, Bot, Database, Edit, LayoutGrid, Save } from 'lucide-react';
import { SaveStatusIndicator } from './components/SaveStatusIndicator.tsx';
import { FilterBar } from './components/FilterBar.tsx';
import { KpiGrid } from './components/KpiGrid.tsx';
import { ChartGrid } from './components/ChartGrid.tsx';
import { ReportList, ReportStudio } from '../report-studio/index.ts';
import { DataStudio } from '../data-studio/index.ts';
import { Button } from '../../components/ui/index.ts';

interface Props {
    project: Project;
    filteredData: any[];
    onOpenEditModal: () => void;
    setIsLayoutModalOpen: (isOpen: boolean) => void;
    onCreateReport: () => void;
    onSelectPresentation: (id: string) => void;
    onRenamePresentation: (id: string) => void;
    onDuplicatePresentation: (id: string) => void;
    onDeletePresentation: (presentation: Presentation) => void;
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
    onProjectUpdate: (updater: (prev: Project) => void) => void;
    editingPresentationId: string | null;
    onBackToHub: () => void;
    onPresentationUpdate: (updatedPresentation: Presentation) => void;
    onPresent: (id: string) => void;
}

export const DashboardWorkspace: React.FC<Props> = ({ 
    project, filteredData, onOpenEditModal, setIsLayoutModalOpen, onCreateReport, onSelectPresentation, 
    onRenamePresentation, onDuplicatePresentation, onDeletePresentation,
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

    const TabButton = ({ view, label, icon: Icon }: { view: 'dashboard' | 'report-studio' | 'data', label: string, icon: React.ElementType }) => (
        <button 
            onClick={() => { setCurrentView(view); onBackToHub(); }} 
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors ${currentView === view ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-slate-200/50'}`}
        >
            <Icon size={16} className="mr-2"/>{label}
        </button>
    );

    const visibleCharts = analysis.charts.filter((c: any) => c.visible);
    
    const structureChartsByLayout = (charts: ChartConfig[], layoutId: string): ChartConfig[][] => {
        const layoutRowsMap: Record<string, number[]> = {
            '2-2-2': [2, 2, 2],
            '3-3': [3, 3],
            '1-2-2': [1, 2, 2],
            '2-3-2': [2, 3, 2],
            '3-4': [3, 4]
        };
        const layoutRows = layoutRowsMap[layoutId] || [2, 2, 2];
        
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
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(new Date(date));
    };

    const visibleKpis = useMemo(() => analysis.kpis.filter((kpi: any) => kpi.visible), [analysis.kpis]);
    const presentationToEdit = project.presentations?.find((p: any) => p.id === editingPresentationId);
    const showProjectHeader = !editingPresentationId;

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {showProjectHeader && (
                <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-6 bg-slate-50 border-b border-slate-200 z-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold text-slate-900 truncate">{project.name}</h2>
                            <p className="text-sm text-slate-500 mt-1 truncate">{project.description || "No description provided."}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center space-x-3">
                            <div className="text-right hidden sm:block">
                                <SaveStatusIndicator status={saveStatus} />
                                {saveStatus !== 'unsaved' && saveStatus !== 'saving' && project.lastSaved && (
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Last saved: {formatDate(project.lastSaved)}
                                    </p>
                                )}
                            </div>
                            <Button 
                                onClick={onManualSave} 
                                variant={saveStatus === 'unsaved' ? 'primary' : 'outline'} 
                                size="sm"
                                icon={Save}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="p-1 bg-slate-200/60 rounded-lg inline-flex items-center space-x-1 border border-slate-200">
                            <TabButton view="dashboard" label="Dashboard" icon={BarChart3} />
                            <TabButton view="report-studio" label="Report Studio" icon={Bot}/>
                            <TabButton view="data" label="Data Studio" icon={Database} />
                        </div>
                        <div className="flex items-center space-x-2 w-full justify-end sm:w-auto">
                            {currentView === 'dashboard' && (
                                <>
                                    <Button onClick={onOpenEditModal} variant="outline" size="sm" icon={Edit}>Edit</Button>
                                    <Button onClick={() => setIsLayoutModalOpen(true)} variant="outline" size="sm" icon={LayoutGrid}>Layout</Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 min-h-0 relative">
                {currentView === 'dashboard' && (
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 py-8">
                        <FilterBar filters={globalFilters} onRemove={onRemoveFilter} />
                        <KpiGrid kpis={visibleKpis} data={project.dataSource.data} dateColumn={props.dateColumn} onKpiClick={onKpiClick} />
                        <ChartGrid 
                            chartRows={chartRows} 
                            getGridColsClass={getGridColsClass} 
                            dataSource={{data: filteredData}} 
                            allData={project.dataSource.data} 
                            dateColumn={props.dateColumn} 
                            onChartUpdate={props.onChartUpdate} 
                            onSetMaximizedChart={props.onSetMaximizedChart} 
                            onGlobalFilterChange={onGlobalFilterChange} 
                            onTimeFilterChange={onTimeFilterChange} 
                            globalFilters={globalFilters} 
                            timeFilter={timeFilter} 
                        />
                    </div>
                )}
                
                {currentView === 'report-studio' && !editingPresentationId && (
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 py-8">
                        <ReportList 
                            project={project} 
                            onCreateReport={onCreateReport} 
                            onSelectPresentation={onSelectPresentation} 
                            onRenamePresentation={onRenamePresentation} 
                            onDuplicatePresentation={onDuplicatePresentation} 
                            onDeletePresentation={onDeletePresentation} 
                        />
                    </div>
                )}
                
                {currentView === 'report-studio' && editingPresentationId && presentationToEdit && (
                    <div className="absolute inset-0">
                        <ReportStudio 
                            project={project}
                            presentation={presentationToEdit}
                            onPresentationUpdate={onPresentationUpdate}
                            onChartUpdate={props.onChartUpdate} 
                            onBackToHub={onBackToHub}
                            onPresent={onPresent}
                        />
                    </div>
                )}
                
                {currentView === 'data' && (
                    <div className="absolute inset-0">
                        <DataStudio project={project} onProjectUpdate={onProjectUpdate} />
                    </div>
                )}
            </div>
        </div>
    );
};
