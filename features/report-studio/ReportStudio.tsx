
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Project, Presentation, Slide, ReportLayoutItem, ContentBlock, KpiConfig, LayoutId, PresentationTheme, DataRow, ChartConfig } from '../../types.ts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ChartRenderer, TimeFilterPreset } from '../../components/charts/ChartRenderer.tsx';
import { v4 as uuidv4 } from 'uuid';
import { exportPresentationToPptx } from '../../services/pptxEngine.ts';
import { 
    ChevronLeft, MonitorPlay, X, Loader2, Download, Plus, Film as FilmIcon, Grid, List, MessageSquareText, MoreHorizontal, Trash2, Filter, Edit3, GripHorizontal
} from 'lucide-react';
import { ContentBlockRenderer } from './components/ContentBlockRenderer.tsx';
import { SlidePreview } from './components/SlidePreview.tsx';
import { FlyoutPanel, IconToolbar } from './components/FlyoutPanel.tsx';
import { ChartMaximizeModal } from '../dashboard/components/modals/ChartMaximizeModal.tsx';

const ResponsiveGridLayout = WidthProvider(Responsive);
const DROPPING_ITEM_ID = '__dropping-elem__';

const DEFAULT_THEME: PresentationTheme = {
    colors: {
        accent1: '#0284c7', accent2: '#0ea5e9', accent3: '#38bdf8', accent4: '#7dd3fc', accent5: '#bae6fd', accent6: '#e0f2fe',
        background: '#FFFFFF', text: '#333333'
    },
    fonts: { heading: 'Inter', body: 'Inter' }
};

const calculateKpiValue = (dataset: DataRow[], kpi: KpiConfig): number | null => {
    if (!dataset || dataset.length === 0) return null;
    let filteredData = dataset;
    if (kpi.primaryCategory && kpi.primaryCategoryValue) {
        filteredData = dataset.filter(r => String(r[kpi.primaryCategory!]) === kpi.primaryCategoryValue);
    }
    let baseValue = 0;
    if (kpi.operation === 'sum') baseValue = filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0);
    else if (kpi.operation === 'average') baseValue = filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0) / (filteredData.length || 1);
    else if (kpi.operation === 'count_distinct') baseValue = new Set(filteredData.map(row => row[kpi.column])).size;
    return baseValue * (kpi.multiplier || 1);
};

const ReportKpiCard: React.FC<{ kpi: KpiConfig, value: number | null }> = ({ kpi, value }) => {
    const formattedValue = value !== null ? new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(value) : '-';
    return (
        <div className="p-4 bg-white rounded-lg border border-slate-200 h-full flex flex-col justify-center text-center shadow-sm select-none overflow-hidden">
            <p className="text-sm font-medium text-slate-500 mb-1 truncate">{kpi.title}</p>
            <p className="text-3xl font-bold text-slate-900">{formattedValue}</p>
        </div>
    );
};

interface PresentationStudioProps {
    project: Project;
    presentation: Presentation;
    onPresentationUpdate: (updatedPresentation: Presentation) => void;
    onChartUpdate?: (updatedChart: ChartConfig) => void;
    onBackToHub: () => void;
    onPresent: (presentationId: string) => void;
}

export const ReportStudio: React.FC<PresentationStudioProps> = ({ project, presentation, onPresentationUpdate, onChartUpdate, onBackToHub, onPresent }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(true);
    const [leftViewMode, setLeftViewMode] = useState<'grid' | 'list'>('list');
    const [isExporting, setIsExporting] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showCenterGuide, setShowCenterGuide] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
    const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);

    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
    const scrollTimeout = useRef<number | null>(null);
    
    const isSlides = presentation.format === 'slides';
    const theme = presentation.theme || DEFAULT_THEME;

    // --- Navigation Handlers ---
    const handleSelectPage = useCallback((index: number) => {
        setCurrentPage(index);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
            
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                setCurrentPage(p => Math.min(p + 1, presentation.slides.length - 1));
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setCurrentPage(p => Math.max(0, p - 1));
            }
        };

        const handleWheel = (e: WheelEvent) => {
            const target = e.target as HTMLElement;
            
            // Smart Scroll Detection:
            // Check if we are scrolling inside an element that actually has scrollable content
            let el: HTMLElement | null = target;
            let isScrollable = false;
            
            while (el && el !== document.body && !el.classList.contains('slide-canvas')) {
                // Check for vertical overflow
                const style = window.getComputedStyle(el);
                const overflowY = style.overflowY;
                const isOverflow = overflowY === 'auto' || overflowY === 'scroll';
                // Add buffer for subpixel differences
                const hasScrollRoom = el.scrollHeight > el.clientHeight + 1;
                
                if (isOverflow && hasScrollRoom) {
                    // We found a scrollable parent. 
                    // Now check if we are at the boundary (top or bottom) to see if we should pass scroll to page
                    const atTop = el.scrollTop <= 0;
                    const atBottom = Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) <= 1;
                    
                    // If scrolling UP and not at top, OR scrolling DOWN and not at bottom, capture scroll
                    if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
                        isScrollable = true;
                        break; 
                    }
                }
                el = el.parentElement;
            }

            if (isScrollable) return; // Let the element scroll normally

            // Block the default page scroll if we are changing slides
            // but allow if we are just scrolling the canvas (which is handled by overflow-y-auto on main)
            // The main canvas IS the scroll container for the page in this layout.
            
            // However, the user requested "scroll up scroll down move from one slide to another"
            // Since we are rendering slides vertically in a scrollable container, native scroll handles it partially,
            // but the "smooth snap" to next slide is what is requested.
            
            if (scrollTimeout.current) return;
            
            if (Math.abs(e.deltaY) > 30) {
               // If we aren't inside a scrollable element, navigate slides
               if (e.deltaY > 0) {
                   setCurrentPage(p => Math.min(p + 1, presentation.slides.length - 1));
               } else {
                   setCurrentPage(p => Math.max(0, p - 1));
               }
               scrollTimeout.current = window.setTimeout(() => scrollTimeout.current = null, 500);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('wheel', handleWheel);
        };
    }, [presentation.slides.length]);

    // Scroll the active slide into view when currentPage changes
    useEffect(() => {
        if (slideRefs.current[currentPage]) {
            slideRefs.current[currentPage]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentPage]);

    const kpiValues = useMemo(() => {
        const values: Record<string, number | null> = {};
        project.analysis?.kpis.forEach(kpi => values[kpi.id] = calculateKpiValue(project.dataSource.data, kpi));
        return values;
    }, [project]);

    const handlePresentationUpdate = (updater: (prev: Presentation) => Presentation) => {
        onPresentationUpdate(updater(presentation));
    };
    
    const handleUpdateTheme = (newColors: any) => {
        handlePresentationUpdate(p => ({
            ...p,
            theme: { ...theme, colors: { ...theme.colors, ...newColors } }
        }));
    };

    // --- Slide Drag & Drop ---
    const handleSlideDragStart = (index: number) => {
        setDraggedSlideIndex(index);
    };

    const handleSlideDrop = (targetIndex: number) => {
        if (draggedSlideIndex === null || draggedSlideIndex === targetIndex) return;

        const newSlides = [...presentation.slides];
        const [movedSlide] = newSlides.splice(draggedSlideIndex, 1);
        newSlides.splice(targetIndex, 0, movedSlide);

        handlePresentationUpdate(p => ({ ...p, slides: newSlides }));
        setDraggedSlideIndex(null);
        setCurrentPage(targetIndex);
    };

    const handleAddPage = () => {
        const choice = prompt("Choose Layout:\n1. Title & Content (Default)\n2. Title Only\n3. Two Column\n4. Section Header", "1");
        let layoutId: LayoutId = 'TITLE_CONTENT';
        let items: ReportLayoutItem[] = [];
        
        if (choice === '2') { 
            layoutId = 'TITLE_SLIDE'; 
            const titleId = `ph_title_${uuidv4()}`;
            handlePresentationUpdate(p => ({ ...p, blocks: [...(p.blocks||[]), { id: titleId, type: 'text', style: 'title', content: 'Click to add title', isPlaceholder: true }] }));
            items.push({ i: titleId, x: 1, y: 4, w: 10, h: 2 });
        } else if (choice === '4') {
            layoutId = 'SECTION_HEADER';
             const titleId = `ph_sec_${uuidv4()}`;
            handlePresentationUpdate(p => ({ ...p, blocks: [...(p.blocks||[]), { id: titleId, type: 'text', style: 'h1', content: 'Section Title', isPlaceholder: true }] }));
            items.push({ i: titleId, x: 1, y: 5, w: 10, h: 2 });
        } else if (choice === '3') {
            layoutId = 'TWO_CONTENT';
            const tId = `ph_t_${uuidv4()}`;
            const c1Id = `ph_c1_${uuidv4()}`;
            const c2Id = `ph_c2_${uuidv4()}`;
            handlePresentationUpdate(p => ({ ...p, blocks: [...(p.blocks||[]), 
                { id: tId, type: 'text', style: 'title', content: 'Slide Title', isPlaceholder: true },
                { id: c1Id, type: 'text', style: 'body', content: 'Content Left', isPlaceholder: true },
                { id: c2Id, type: 'text', style: 'body', content: 'Content Right', isPlaceholder: true }
            ] }));
            items.push({ i: tId, x: 0, y: 0, w: 12, h: 2 });
            items.push({ i: c1Id, x: 0, y: 2, w: 6, h: 8 });
            items.push({ i: c2Id, x: 6, y: 2, w: 6, h: 8 });
        } else {
            const tId = `ph_t_${uuidv4()}`;
            const cId = `ph_c_${uuidv4()}`;
            handlePresentationUpdate(p => ({ ...p, blocks: [...(p.blocks||[]), 
                { id: tId, type: 'text', style: 'title', content: 'Slide Title', isPlaceholder: true },
                { id: cId, type: 'text', style: 'body', content: 'Click to add text', isPlaceholder: true }
            ] }));
            items.push({ i: tId, x: 0, y: 0, w: 12, h: 2 });
            items.push({ i: cId, x: 1, y: 2, w: 10, h: 8 });
        }

        const newSlide: Slide = { id: `slide_${uuidv4()}`, layout: items, layoutId };
        handlePresentationUpdate(p => ({ ...p, slides: [...p.slides, newSlide] }));
        setTimeout(() => handleSelectPage(presentation.slides.length), 100);
    };
    
    const handleAddSection = (index: number) => {
        const title = prompt("Enter Section Name:");
        if (title) {
             handlePresentationUpdate(p => ({
                ...p,
                slides: p.slides.map((s, i) => i === index ? { ...s, sectionTitle: title } : s)
            }));
        }
    }
    
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        handlePresentationUpdate(p => ({
            ...p,
            slides: p.slides.map((s, i) => i === currentPage ? { ...s, notes: val } : s)
        }));
    };

    const handleDeletePage = (index: number) => {
        if (presentation.slides.length <= 1) return alert("Cannot delete the last slide.");
        const newSlides = presentation.slides.filter((_, i) => i !== index);
        handlePresentationUpdate(p => ({ ...p, slides: newSlides }));
        if (currentPage >= newSlides.length) setCurrentPage(newSlides.length - 1);
    };
    
    const handleLayoutChange = (index: number, newLayout: ReportLayoutItem[]) => {
        const cleanLayout = newLayout.filter(item => item.i !== DROPPING_ITEM_ID);
        handlePresentationUpdate(p => ({
            ...p,
            slides: p.slides.map((s, i) => i === index ? { ...s, layout: cleanLayout } : s)
        }));
    };

    const handleDrag = (layout: ReportLayoutItem[], oldItem: ReportLayoutItem, newItem: ReportLayoutItem) => {
        const center = newItem.x + (newItem.w / 2);
        if (Math.abs(center - 6) < 0.1) {
            setShowCenterGuide(true);
        } else {
            setShowCenterGuide(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportPresentationToPptx(project, presentation);
        } catch (e) {
            console.error("Failed to export", e);
            alert("Failed to export presentation.");
        } finally {
            setIsExporting(false);
        }
    };
    
    const onDrop = (index: number, _: ReportLayoutItem[], item: ReportLayoutItem, e: Event) => {
        const dataStr = (e as DragEvent).dataTransfer?.getData('application/json');
        if (!dataStr) return;
        const data = JSON.parse(dataStr);
        if (!data.type) return;

        let newItem: ReportLayoutItem | null = null;
        let w = 4, h = 4;

        if (data.type === 'chart' || data.type === 'kpi') {
             if (presentation.slides[index].layout.some(l => l.i === data.id)) return;
             if (data.type === 'chart') { w = 6; h = 5; }
             else { w = 3; h = 2; }
             newItem = { ...item, i: data.id, w, h };
             handlePresentationUpdate(p => {
                 const updatedSlides = p.slides.map((s, i) => {
                    if (i === index) {
                        if (s.layout.some(l => l.i === newItem!.i)) return s;
                        return { ...s, layout: [...s.layout, newItem!] };
                    }
                    return s;
                });
                return { ...p, slides: updatedSlides };
             });
        } else {
            const newBlock: ContentBlock = { 
                id: `${data.type}_${uuidv4()}`, 
                type: data.type, 
                title: '', 
                content: data.content || '', 
                style: data.style 
            };
            if (data.type === 'text') {
                if (data.style === 'title') { w = 12; h = 2; }
                else if (data.style === 'h1' || data.style === 'h2') { w = 8; h = 1; }
                else if (['quote', 'note', 'warning'].includes(data.style)) { w = 8; h = 3; }
                else if (['bullet', 'number', 'todo'].includes(data.style)) { w = 6; h = 6; }
                else { w = 6; h = 2; }
            } else if (data.type === 'image' || data.type === 'video') {
                w = 6; h = 6;
            } else if (data.type === 'shape') {
                w = 3; h = 3;
            } else if (data.type === 'table') {
                w = 8; h = 6;
            }
            
            newItem = { ...item, i: newBlock.id, w, h };
            
            handlePresentationUpdate(p => {
                const updatedBlocks = [...(p.blocks || []), newBlock];
                const updatedSlides = p.slides.map((s, i) => {
                    if (i === index) {
                        return { ...s, layout: [...s.layout, newItem!] };
                    }
                    return s;
                });
                return { ...p, blocks: updatedBlocks, slides: updatedSlides };
            });
        }
    };
    
    const handleRemoveItem = (slideIndex: number, itemId: string) => {
         handlePresentationUpdate(p => {
            const updatedSlides = p.slides.map((s, i) => {
                if (i === slideIndex) {
                    return { ...s, layout: s.layout.filter(item => item.i !== itemId) };
                }
                return s;
            });
            let updatedBlocks = p.blocks || [];
            if (!itemId.startsWith('chart_') && !project.analysis?.kpis.some(k => k.id === itemId)) {
                updatedBlocks = updatedBlocks.filter(b => b.id !== itemId);
            }
            return { ...p, slides: updatedSlides, blocks: updatedBlocks };
        });
        setActiveMenuId(null);
    };

    const handleChartUpdateInternal = (updatedChart: ChartConfig) => {
        if (onChartUpdate) {
            onChartUpdate(updatedChart);
        } else {
            console.warn("Chart update not supported in this context (missing onChartUpdate prop)");
        }
    };
    
    const renderGridItemContent = (item: ReportLayoutItem) => {
        const chart = project.analysis?.charts.find(c => c.id === item.i);
        if (chart) return (
            <div className="w-full h-full p-2 bg-white rounded-lg shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <ChartRenderer config={chart} data={project.dataSource.data} allData={project.dataSource.data} dateColumn={null} onFilterChange={()=>{}} onTimeFilterChange={()=>{}} activeFilters={{}} activeTimeFilter={{type:'all'}} />
            </div>
        );
        const kpi = project.analysis?.kpis.find(k => k.id === item.i);
        if (kpi) return <div className="w-full h-full"><ReportKpiCard kpi={kpi} value={kpiValues[kpi.id] ?? null} /></div>;
        const block = (presentation.blocks || []).find(b => b.id === item.i);
        if(block) return <div className="w-full h-full"><ContentBlockRenderer block={block} theme={theme} onUpdate={b => handlePresentationUpdate(p => ({ ...p, blocks: (p.blocks || []).map(tb => tb.id === b.id ? b : tb)}))} /></div>;
        return <div className="p-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded flex items-center justify-center h-full">Missing Item</div>;
    }

    const renderItemMenu = (item: ReportLayoutItem) => {
        if (activeMenuId !== item.i) return null;
        
        const isChart = item.i.startsWith('chart_');
        return (
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 z-[100] bg-white rounded-lg shadow-xl border border-slate-200 py-1 w-36 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                {isChart && (
                    <button 
                        onMouseDown={(e) => { e.stopPropagation(); setEditingChart(project.analysis?.charts.find(c => c.id === item.i) || null); setActiveMenuId(null); }} 
                        className="text-left px-3 py-2.5 text-sm hover:bg-slate-50 flex items-center text-slate-700"
                    >
                        <Filter size={14} className="mr-2"/> Edit Data
                    </button>
                )}
                <button 
                    onMouseDown={(e) => { e.stopPropagation(); setActivePanel('theme'); setActiveMenuId(null); }} 
                    className="text-left px-3 py-2.5 text-sm hover:bg-slate-50 flex items-center text-slate-700"
                >
                    <Edit3 size={14} className="mr-2"/> Format
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button 
                    onMouseDown={(e) => { e.stopPropagation(); handleRemoveItem(currentPage, item.i); }} 
                    className="text-left px-3 py-2.5 text-sm hover:bg-red-50 flex items-center text-red-600"
                >
                    <Trash2 size={14} className="mr-2"/> Delete
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-[#F0F2F5] overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 h-14 flex justify-between items-center z-40 relative shadow-sm">
                <div className="flex-shrink-0 flex justify-start items-center w-32">
                    <button onClick={onBackToHub} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                        <ChevronLeft size={16} className="mr-1" /> Back to Hub
                    </button>
                </div>
                <div className="flex-1 flex justify-center px-4 min-w-0">
                    <input 
                        type="text"
                        value={presentation.name}
                        onChange={e => handlePresentationUpdate(p => ({ ...p, name: e.target.value }))}
                        className="text-lg font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border-transparent focus:border-primary-300 border rounded px-4 py-1 outline-none transition-all w-full max-w-4xl text-center"
                        placeholder="Presentation Title"
                    />
                </div>
                <div className="flex-shrink-0 flex justify-end items-center space-x-3 w-auto">
                    <button onClick={() => setShowNotes(!showNotes)} className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${showNotes ? 'text-yellow-600 bg-yellow-100' : 'text-slate-500'}`} title="Speaker Notes">
                        <MessageSquareText size={20} />
                    </button>
                    <button onClick={handleExport} disabled={isExporting} className="px-4 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-full shadow-sm flex items-center transition-transform transform active:scale-95 disabled:opacity-50">
                         {isExporting ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Download size={14} className="mr-2" />} Export PPTX
                    </button>
                    <button onClick={() => onPresent(presentation.id)} className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-full shadow-sm flex items-center transition-transform transform active:scale-95">
                        <MonitorPlay size={14} className="mr-2" /> Present
                    </button>
                </div>
            </header>
            
            <div className="flex-1 relative overflow-hidden">
                {/* Center Canvas */}
                <main className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col items-center pt-12 pb-32 transition-all duration-300 slide-canvas" onClick={() => setActiveMenuId(null)}>
                    <div className="w-full max-w-5xl space-y-20 pb-32">
                        {presentation.slides.map((slide, index) => {
                             const rowHeight = isSlides ? 50 : 40; 
                             const isActive = index === currentPage;
                             
                             const containerStyle = isActive 
                                ? { zIndex: 10, opacity: 1, position: 'relative', transform: 'scale(1)' } as React.CSSProperties
                                : { zIndex: 0, opacity: 0, position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none', height: 0, overflow: 'hidden', transform: 'scale(0.95)' } as React.CSSProperties;
                             
                             return (
                                <div
                                    key={slide.id}
                                    ref={el => { slideRefs.current[index] = el; }}
                                    className={`relative transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] origin-center`}
                                    style={containerStyle}
                                >
                                    <div 
                                        className={`bg-white shadow-xl border border-slate-200 rounded-sm relative ${isSlides ? 'aspect-video' : 'aspect-[1/1.414]'} transition-shadow duration-300 ring-1 ring-slate-900/5`}
                                        style={{ backgroundColor: theme.colors.background }}
                                    >
                                        {showCenterGuide && (
                                            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-pink-500 z-50 pointer-events-none transform -translate-x-1/2"></div>
                                        )}
                                        
                                        <ResponsiveGridLayout
                                            className="layout"
                                            layouts={{ lg: slide.layout || [] }}
                                            breakpoints={{ lg: 1000 }}
                                            cols={{ lg: 12 }}
                                            rowHeight={rowHeight}
                                            onDrop={(layout, item, e) => onDrop(index, layout, item, e)}
                                            onLayoutChange={(newLayout) => handleLayoutChange(index, newLayout)}
                                            onDrag={handleDrag}
                                            onDragStop={() => setShowCenterGuide(false)}
                                            isDroppable={true}
                                            isDraggable={true}
                                            isResizable={true}
                                            allowOverlap={true}
                                            resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
                                            margin={[12, 12]}
                                            containerPadding={[24, 24]}
                                            droppingItem={{ i: DROPPING_ITEM_ID, w: 4, h: 4 }}
                                            draggableCancel=".nodrag"
                                        >
                                            {(slide.layout || []).map(item => (
                                                // FIX: Force visible overflow to ensure context menu isn't clipped.
                                                // We put overflow-hidden on the inner content div instead.
                                                <div key={item.i} className="group/item relative bg-transparent hover:ring-1 hover:ring-slate-300 rounded transition-all hover:z-[60] !overflow-visible">
                                                    {/* Inner content with hidden overflow to contain chart/text */}
                                                    <div className="w-full h-full overflow-hidden rounded-sm">
                                                        {renderGridItemContent(item)}
                                                    </div>
                                                    
                                                    {/* 3-Dots Menu Button - Absolute outside top right */}
                                                    <button 
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.i ? null : item.i); }}
                                                        className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 text-slate-500 hover:text-primary-600 opacity-0 group-hover/item:opacity-100 transition-all z-[70] cursor-pointer nodrag flex items-center justify-center hover:scale-110"
                                                        title="Options"
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                    
                                                    {renderItemMenu(item)}
                                                </div>
                                            ))}
                                        </ResponsiveGridLayout>
                                    </div>
                                    <div className="absolute top-0 -left-10 text-xl font-bold text-slate-300 select-none">
                                        {String(index + 1).padStart(2, '0')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>

                {/* Speaker Notes Panel - Improved UI with yellow post-it style */}
                <div className={`absolute bottom-0 left-0 right-0 bg-yellow-50 border-t-4 border-yellow-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 z-[100] flex flex-col ${showNotes ? 'h-48' : 'h-0 overflow-hidden'}`}>
                    {/* Grab handle visual */}
                    <div className="flex justify-center py-1.5 cursor-ns-resize bg-yellow-100 border-b border-yellow-200 hover:bg-yellow-200 transition-colors" onClick={() => setShowNotes(!showNotes)}>
                        <div className="w-16 h-1.5 bg-yellow-300/80 rounded-full"></div>
                    </div>
                    <div className="px-4 py-2 text-xs font-bold text-yellow-800 uppercase tracking-wider flex justify-between items-center bg-yellow-50">
                        <span>Speaker Notes</span>
                        <button onClick={() => setShowNotes(false)} className="text-yellow-600 hover:text-yellow-900"><X size={14}/></button>
                    </div>
                    <textarea 
                        className="flex-1 w-full px-6 py-2 resize-none outline-none text-base text-slate-800 font-sans bg-transparent leading-relaxed placeholder:text-yellow-800/40"
                        placeholder="Click here to add notes for your presentation..."
                        value={presentation.slides[currentPage]?.notes || ''}
                        onChange={handleNotesChange}
                    />
                </div>

                {/* Left Floating Menu: Slide Navigation */}
                <div className={`absolute left-6 top-6 bottom-6 z-30 flex flex-col pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${isLeftMenuOpen ? 'w-64' : 'w-14 justify-center'}`}>
                    
                    {/* Expanded Panel */}
                    <div className={`absolute left-0 top-0 w-64 h-full pointer-events-auto flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden transition-all duration-300 ease-in-out origin-left ${isLeftMenuOpen ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'}`}>
                         <header className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                             <h3 className="font-bold text-slate-800">Slides</h3>
                             <div className="flex items-center space-x-1">
                                 <button onClick={() => setLeftViewMode('grid')} className={`p-1.5 rounded ${leftViewMode === 'grid' ? 'bg-white shadow text-primary-600' : 'text-slate-400 hover:text-slate-600'}`} title="Grid View"><Grid size={14}/></button>
                                 <button onClick={() => setLeftViewMode('list')} className={`p-1.5 rounded ${leftViewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-slate-400 hover:text-slate-600'}`} title="List View"><List size={14}/></button>
                                 <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                 <button onClick={() => setIsLeftMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"><X size={14}/></button>
                             </div>
                         </header>
                         <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                            {presentation.slides.map((slide, index) => (
                                <SlidePreview 
                                    key={slide.id} 
                                    index={index} 
                                    slide={slide} 
                                    project={project} 
                                    presentation={presentation} 
                                    isActive={index === currentPage}
                                    isSlides={isSlides}
                                    viewMode={leftViewMode}
                                    onClick={() => handleSelectPage(index)}
                                    onDelete={(e) => { e.stopPropagation(); handleDeletePage(index); }}
                                    onAddSection={(e) => { e.stopPropagation(); handleAddSection(index); }}
                                    draggable={true}
                                    onDragStart={(e) => { e.stopPropagation(); handleSlideDragStart(index); }}
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleSlideDrop(index); }}
                                    isDragging={draggedSlideIndex === index}
                                />
                            ))}
                            <button onClick={handleAddPage} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-1 mt-2">
                                <Plus size={20} />
                                <span className="text-xs font-semibold">Add Slide</span>
                            </button>
                         </div>
                    </div>

                    {/* Collapsed Button */}
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none`}>
                         <button 
                            onClick={() => setIsLeftMenuOpen(true)}
                            className={`pointer-events-auto w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-600 hover:text-primary-600 hover:scale-110 transition-all duration-300 ease-out border border-slate-100 ${!isLeftMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
                            title="Open Slide Navigation"
                        >
                             <FilmIcon size={24} />
                         </button>
                    </div>
                </div>

                {/* Right Floating Menu: Toolbox */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 flex flex-row-reverse items-center pointer-events-none">
                    {/* The Toolbar Pill (Always Visible) */}
                    <div className="pointer-events-auto">
                         <IconToolbar activePanel={activePanel} setActivePanel={setActivePanel} />
                    </div>
                    
                    {/* The Flyout Panel (Slides out) */}
                     <div 
                        className={`pointer-events-auto mr-4 h-[600px] max-h-[80vh] w-72 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] transform origin-right ${activePanel ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-8 opacity-0 scale-95 pointer-events-none'}`}
                    >
                         <FlyoutPanel activePanel={activePanel} project={project} presentation={presentation} onUpdateTheme={handleUpdateTheme} onClose={() => setActivePanel(null)} />
                    </div>
                </div>

            </div>
            
            {/* Chart Editing Modal */}
            {editingChart && (
                <ChartMaximizeModal 
                    config={editingChart}
                    data={project.dataSource.data}
                    allData={project.dataSource.data}
                    dateColumn={null}
                    onUpdate={handleChartUpdateInternal} 
                    onClose={() => setEditingChart(null)}
                    onFilterChange={() => {}} 
                    onTimeFilterChange={() => {}}
                    activeFilters={{}}
                    activeTimeFilter={{type: 'all'}}
                />
            )}
        </div>
    );
};
