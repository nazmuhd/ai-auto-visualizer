
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Project, ReportLayoutItem, KpiConfig, ContentBlock, DataRow, Presentation } from '../types.ts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ChartRenderer } from './charts/ChartRenderer.tsx';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, PlayCircle, Eye, EyeOff } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface PresentationViewProps {
    project: Project;
    presentation: Presentation;
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

const ReportContentBlock: React.FC<{ block: ContentBlock }> = ({ block }) => {
    if (block.type === 'image') {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded overflow-hidden">
                {block.content ? <img src={block.content} alt="Presentation Content" className="max-w-full max-h-full object-contain"/> : <ImageIcon size={40} className="text-slate-300"/>}
            </div>
        );
    }
    if (block.type === 'video') {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-900 rounded overflow-hidden">
                {block.content ? <p className="text-white text-sm truncate px-4">{block.content}</p> : <PlayCircle size={40} className="text-slate-500"/>}
            </div>
        );
    }
    if (block.type === 'shape') {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="text-primary-600 fill-current opacity-20">
                    {block.style === 'circle' && <circle cx="50" cy="50" r="48" />}
                    {block.style === 'triangle' && <polygon points="50,5 95,95 5,95" />}
                    {block.style === 'arrow' && <path d="M10,35 L60,35 L60,10 L95,50 L60,90 L60,65 L10,65 Z" />}
                    {(block.style === 'rect' || !block.style) && <rect x="2" y="2" width="96" height="96" rx="8" />}
                </svg>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-lg border border-slate-200 h-full prose prose-sm max-w-none prose-p:my-1 overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: (block.content || '').replace(/\n/g, '<br />') || '<p class="text-slate-400">Empty</p>' }} />
        </div>
    );
};


export const PresentationView: React.FC<PresentationViewProps> = ({ project, presentation, onClose }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [showUI, setShowUI] = useState(true);
    const slides = presentation.slides || [];
    const totalPages = slides.length;
    
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
        
        const block = (presentation.blocks || []).find(b => b.id === item.i);
        if(block) return <ReportContentBlock block={block} />;

        return <div className="bg-slate-100 rounded-lg p-4">Unknown item: {item.i}</div>;
    };
    
    const currentLayout = slides[currentPage]?.layout || [];
    const isSlides = presentation.format === 'slides';
    
    // Use max-h-[90vh] to ensure it fits on screen. Use auto margin for safe centering.
    const pageContainerClass = isSlides
        ? 'aspect-video w-full max-w-[95vw] max-h-[90vh] bg-white shadow-lg relative'
        : 'aspect-[1/1.414] w-full max-w-4xl mx-auto my-4 bg-white shadow-lg border border-slate-200';

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-100 overflow-hidden">
            <header className={`flex-shrink-0 bg-white border-b border-slate-200 px-4 py-2 relative flex justify-between items-center transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none absolute top-0 left-0 w-full z-10'}`}>
                <div className="flex-1"></div>
                <h3 className="text-lg font-bold text-slate-800 flex-1 text-center truncate px-4">{presentation.name}</h3>
                <div className="flex-1 flex justify-end items-center space-x-2">
                     <button onClick={() => setShowUI(!showUI)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 pointer-events-auto">
                        {showUI ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 pointer-events-auto">
                        <X size={20} />
                    </button>
                </div>
            </header>
            
            {/* Floating toggle when UI is hidden */}
            {!showUI && (
                <div className="absolute top-4 right-4 z-50 flex space-x-2">
                     <button onClick={() => setShowUI(true)} className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-slate-600 backdrop-blur-sm transition-colors">
                        <EyeOff size={20} />
                    </button>
                    <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-slate-600 backdrop-blur-sm transition-colors">
                        <X size={20} />
                    </button>
                </div>
            )}
            
            {/* Changed layout to flex column with m-auto for safe centering of slide */}
            <main className="flex-1 p-4 overflow-auto flex flex-col">
                <div className={`${pageContainerClass} m-auto`}>
                     <ResponsiveGridLayout
                        className="layout"
                        layouts={{ lg: currentLayout }}
                        breakpoints={{ lg: 1200 }}
                        cols={{ lg: 12 }}
                        rowHeight={isSlides ? 50 : 35}
                        isDraggable={false}
                        isResizable={false}
                        containerPadding={[0, 0]}
                        margin={[10, 10]}
                    >
                        {currentLayout.map(item => (
                            <div key={item.i} className="bg-white">
                                {renderGridItem(item)}
                            </div>
                        ))}
                    </ResponsiveGridLayout>
                </div>
            </main>

            {showUI && (
                <footer className="flex-shrink-0 bg-white/80 backdrop-blur-sm px-4 py-3 flex justify-center items-center transition-opacity duration-300">
                    <div className="flex items-center space-x-4">
                        <button onClick={handlePrevPage} disabled={currentPage === 0} className="p-2 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm font-medium text-slate-600">
                            {isSlides ? 'Slide' : 'Page'} {currentPage + 1} of {totalPages}
                        </span>
                        <button onClick={handleNextPage} disabled={currentPage === totalPages - 1} className="p-2 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
};
