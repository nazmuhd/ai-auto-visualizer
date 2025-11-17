import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Project, ReportLayoutItem, KpiConfig, ChartConfig, TextBlock, DataRow } from '../types.ts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ChartRenderer } from './charts/ChartRenderer.tsx';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface PresentationViewProps {
    project: Project;
    onClose: () => void;
}

const calculateKpiValue = (dataset: DataRow[], kpi: KpiConfig): number | null => {
    if (!dataset || dataset.length === 0) return null;
    let filteredData = dataset;
    if (kpi.primaryCategory && kpi.primaryCategoryValue) {
        filteredData = dataset.filter(r => String(r[kpi.primaryCategory!]) === kpi.primaryCategoryValue);
    }

    let baseValue = 0;
    if (kpi.operation === 'sum') baseValue = filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0);
    else if (kpi.operation === 'average') baseValue = filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0) / (filteredData.length || 1);
    else if (kpi.operation === 'count_distinct') {
        const values = filteredData.map(row => row[kpi.column]);
        baseValue = new Set(values).size;
    }
    
    return baseValue * (kpi.multiplier || 1);
};


const ReportKpiCard: React.FC<{ kpi: KpiConfig, value: number | null }> = ({ kpi, value }) => {
    const formattedValue = value !== null ? new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(value) : '-';
    return (
        <div className="p-4 bg-white rounded-lg border border-slate-200 h-full flex flex-col justify-center text-center">
            <p className="text-sm font-medium text-slate-500 mb-1 truncate">{kpi.title}</p>
            <p className="text-3xl font-bold text-slate-900">{formattedValue}</p>
        </div>
    );
};

const ReportTextBlock: React.FC<{ block: TextBlock }> = ({ block }) => (
    <div className="p-4 bg-white rounded-lg border border-slate-200 h-full prose prose-sm max-w-none prose-p:my-1 overflow-y-auto">
        <div dangerouslySetInnerHTML={{ __html: block.content.replace(/\n/g, '<br />') || '<p class="text-slate-400">Empty</p>' }} />
    </div>
);


export const PresentationView: React.FC<PresentationViewProps> = ({ project, onClose }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const pages = project.reportLayout || [[]];
    const totalPages = pages.length;

    const kpiValues = useMemo(() => {
        const values: Record<string, number | null> = {};
        project.analysis?.kpis.forEach(kpi => {
            values[kpi.id] = calculateKpiValue(project.dataSource.data, kpi);
        });
        return values;
    }, [project.analysis?.kpis, project.dataSource.data]);
    
    const handleNextPage = useCallback(() => {
        setCurrentPage(current => Math.min(current + 1, totalPages - 1));
    }, [totalPages]);

    const handlePrevPage = useCallback(() => {
        setCurrentPage(current => Math.max(0, current - 1));
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                handleNextPage();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrevPage();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNextPage, handlePrevPage, onClose]);


    const renderGridItem = (item: ReportLayoutItem) => {
        const chart = project.analysis?.charts.find(c => c.id === item.i);
        if (chart) return <ChartRenderer config={chart} data={project.dataSource.data} allData={project.dataSource.data} dateColumn={null} onFilterChange={()=>{}} onTimeFilterChange={()=>{}} activeFilters={{}} activeTimeFilter={{type:'all'}} />;

        const kpi = project.analysis?.kpis.find(k => k.id === item.i);
        if (kpi) return <ReportKpiCard kpi={kpi} value={kpiValues[kpi.id] ?? null} />;
        
        const textBlock = project.reportTextBlocks?.find(b => b.id === item.i);
        if(textBlock) return <ReportTextBlock block={textBlock} />;

        return <div className="bg-slate-100 rounded-lg p-4">Unknown item: {item.i}</div>;
    };

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-100">
            <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">{project.name} - Presentation</h3>
                <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                    <X size={20} />
                </button>
            </header>
            
            <main className="flex-1 p-4 overflow-hidden flex items-center justify-center">
                <div className="aspect-video w-full max-w-7xl bg-white shadow-lg relative">
                     <ResponsiveGridLayout
                        className="layout"
                        layouts={{ lg: pages[currentPage] || [] }}
                        breakpoints={{ lg: 1200 }}
                        cols={{ lg: 12 }}
                        rowHeight={50}
                        isDraggable={false}
                        isResizable={false}
                        containerPadding={[0, 0]}
                        margin={[10, 10]}
                    >
                        {(pages[currentPage] || []).map(item => (
                            <div key={item.i} className="bg-white">
                                {renderGridItem(item)}
                            </div>
                        ))}
                    </ResponsiveGridLayout>
                </div>
            </main>

            <footer className="flex-shrink-0 bg-white/80 backdrop-blur-sm px-4 py-3 flex justify-center items-center">
                <div className="flex items-center space-x-4">
                    <button onClick={handlePrevPage} disabled={currentPage === 0} className="p-2 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-medium text-slate-600">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages - 1} className="p-2 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default PresentationView;
