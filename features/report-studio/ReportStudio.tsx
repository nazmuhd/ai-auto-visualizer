
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Project, Presentation, Slide, ReportLayoutItem, ContentBlock, KpiConfig, LayoutId, PresentationTheme, DataRow } from '../../types.ts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ChartRenderer } from '../../components/charts/ChartRenderer.tsx';
import { v4 as uuidv4 } from 'uuid';
import { exportPresentationToPptx } from '../../services/pptxEngine.ts';
import { 
    ChevronLeft, MonitorPlay, X, Loader2, Download, Plus, Film as FilmIcon, Grid, List, MessageSquareText
} from 'lucide-react';
import { ContentBlockRenderer } from './components/ContentBlockRenderer.tsx';
import { SlidePreview } from './components/SlidePreview.tsx';
import { FlyoutPanel, IconToolbar } from './components/FlyoutPanel.tsx';

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
        <div className="p-4 bg-white rounded-lg border border-slate-200 h-full flex flex-col justify-center text-center shadow-sm select-none">
            <p className="text-sm font-medium text-slate-500 mb-1 truncate">{kpi.title}</p>
            <p className="text-3xl font-bold text-slate-900">{formattedValue}</p>
        </div>
    );
};

interface PresentationStudioProps {
    project: Project;
    presentation: Presentation;
    onPresentationUpdate: (updatedPresentation: Presentation) => void;
    onBackToHub: () => void;
    onPresent: (presentationId: string) => void;
}

export const ReportStudio: React.FC<PresentationStudioProps> = ({ project, presentation, onPresentationUpdate, onBackToHub, onPresent }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(true);
    const [leftViewMode, setLeftViewMode] = useState<'grid' | 'list'>('grid');
    const [isExporting, setIsExporting] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    const isSlides = presentation.format === 'slides';
    const theme = presentation.theme || DEFAULT_THEME;

    const handleSelectPage = useCallback((index: number) => {
        setCurrentPage(index);
        slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

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
    };
    
    const renderGridItemContent = (item: ReportLayoutItem) => {
        const chart = project.analysis?.charts.find(c => c.id === item.i);
        if (chart) return <div className="w-full h-full p-2 bg-white rounded-lg shadow-sm border border-slate-100 flex flex-col"><ChartRenderer config={chart} data={project.dataSource.data} allData={project.dataSource.data} dateColumn={null} onFilterChange={()=>{}} onTimeFilterChange={()=>{}} activeFilters={{}} activeTimeFilter={{type:'all'}} /></div>;
        const kpi = project.analysis?.kpis.find(k => k.id === item.i);
        if (kpi) return <div className="w-full h-full"><ReportKpiCard kpi={kpi} value={kpiValues[kpi.id] ?? null} /></div>;
        const block = (presentation.blocks || []).find(b => b.id === item.i);
        if(block) return <div className="w-full h-full"><ContentBlockRenderer block={block} theme={theme} onUpdate={b => handlePresentationUpdate(p => ({ ...p, blocks: (p.blocks || []).map(tb => tb.id === b.id ? b : tb)}))} /></div>;
        return <div className="p-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded flex items-center justify-center h-full">Missing Item</div>;
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
                    <button onClick={() => setShowNotes(!showNotes)} className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${showNotes ? 'text-primary-600 bg-primary-50' : 'text-slate-500'}`} title="Speaker Notes">
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
                <main className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col items-center pt-12 pb-32">
                    <div className="w-full max-w-5xl space-y-20 pb-32">
                        {presentation.slides.map((slide, index) => {
                             const rowHeight = isSlides ? 50 : 40; 
                             const isActive = index === currentPage;
                             
                             return (
                                <div
                                    key={slide.id}
                                    ref={el => { slideRefs.current[index] = el; }}
                                    className={`relative transition-all duration-500 ease-in-out ${isActive ? 'opacity-100 scale-100 z-10' : 'opacity-30 scale-95 hover:opacity-60 cursor-pointer z-0 grayscale'}`}
                                    onClick={() => !isActive && setCurrentPage(index)}
                                >
                                    <div 
                                        className={`bg-white shadow-xl border border-slate-200 rounded-sm overflow-hidden relative ${isSlides ? 'aspect-video' : 'aspect-[1/1.414]'} transition-shadow duration-300 ${isActive ? 'shadow-2xl ring-1 ring-slate-900/5' : ''}`}
                                        style={{ backgroundColor: theme.colors.background }}
                                    >
                                        {isActive ? (
                                            <ResponsiveGridLayout
                                                className="layout"
                                                layouts={{ lg: slide.layout || [] }}
                                                breakpoints={{ lg: 1000 }}
                                                cols={{ lg: 12 }}
                                                rowHeight={rowHeight}
                                                onDrop={(layout, item, e) => onDrop(index, layout, item, e)}
                                                onLayoutChange={(newLayout) => handleLayoutChange(index, newLayout)}
                                                isDroppable={true}
                                                isDraggable={true}
                                                isResizable={true}
                                                margin={[12, 12]}
                                                containerPadding={[24, 24]}
                                                droppingItem={{ i: DROPPING_ITEM_ID, w: 4, h: 4 }}
                                                draggableCancel=".nodrag"
                                            >
                                                {(slide.layout || []).map(item => (
                                                    <div key={item.i} className="group relative bg-transparent hover:ring-1 hover:ring-slate-300 rounded transition-all">
                                                        <div className="w-full h-full">
                                                            {renderGridItemContent(item)}
                                                        </div>
                                                        <button 
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveItem(index, item.i); }}
                                                            className="nodrag absolute -top-2 -right-2 p-1.5 rounded-full bg-white shadow border border-slate-200 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                        <div className="absolute bottom-0 right-0 p-1 cursor-se-resize opacity-0 group-hover:opacity-100">
                                                            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </ResponsiveGridLayout>
                                        ) : (
                                            <div className="w-full h-full p-6 grid grid-cols-12 gap-3 relative pointer-events-none">
                                                 {slide.layout.map(item => {
                                                     const style: React.CSSProperties = {
                                                         gridColumn: `${item.x + 1} / span ${item.w}`,
                                                         gridRow: `${item.y + 1} / span ${item.h}`,
                                                     };
                                                     return <div key={item.i} style={style} className="bg-slate-100 border border-slate-200 rounded opacity-50"></div>
                                                 })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute top-0 -left-10 text-xl font-bold text-slate-300 select-none">
                                        {String(index + 1).padStart(2, '0')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>

                {/* Speaker Notes Panel */}
                <div className={`absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg transition-all duration-300 z-20 flex flex-col ${showNotes ? 'h-48' : 'h-0 overflow-hidden'}`}>
                    <div className="bg-slate-50 px-4 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex justify-between">
                        <span>Speaker Notes</span>
                        <button onClick={() => setShowNotes(false)}><X size={14}/></button>
                    </div>
                    <textarea 
                        className="flex-1 w-full p-4 resize-none outline-none text-sm text-slate-700"
                        placeholder="Add speaker notes for this slide..."
                        value={presentation.slides[currentPage]?.notes || ''}
                        onChange={handleNotesChange}
                    />
                </div>

                {/* Left Floating Menu: Slide Navigation */}
                <div className={`absolute left-6 top-6 bottom-6 z-30 flex flex-col pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${isLeftMenuOpen ? 'w-64' : 'w-14 justify-center'}`}>
                    
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
        </div>
    );
};
