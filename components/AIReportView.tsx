import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Project, ReportLayoutItem, KpiConfig, ChartConfig, TextBlock, DataRow, Presentation, Slide } from '../types.ts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ChartRenderer } from './charts/ChartRenderer.tsx';
import { v4 as uuidv4 } from 'uuid';
import { addSlideWithAI } from '../services/geminiService.ts';
// FIX: Renamed `Type` to `TypeIcon` to avoid a name collision with the `Type` enum from `@google/genai` which is used in `geminiService`.
import { BarChart3, TrendingUp, Type as TypeIcon, AlignJustify, PlusCircle, File, GripVertical, Trash2, ChevronLeft, MonitorPlay, Sparkles, LayoutGrid, List, X, ChevronDown, Plus, Send, Loader2 } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

// --- HELPER COMPONENTS ---

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
        <div className="p-4 bg-white rounded-lg border border-slate-200 h-full flex flex-col justify-center text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1 truncate">{kpi.title}</p>
            <p className="text-3xl font-bold text-slate-900">{formattedValue}</p>
        </div>
    );
};

const EditableTextBlock: React.FC<{ block: TextBlock, onUpdate: (updatedBlock: TextBlock) => void }> = ({ block, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(block.content);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { setContent(block.content); }, [block.content]);
    
    useEffect(() => {
        if (isEditing && textAreaRef.current) {
            textAreaRef.current.focus();
            const el = textAreaRef.current;
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    }, [isEditing]);

    const handleSave = () => {
        if (content !== block.content) {
            onUpdate({ ...block, content });
        }
        setIsEditing(false);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    }
    
    const renderedContent = content.replace(/\n/g, '<br />') || `<p class="text-slate-400 italic">Double-click to add text...</p>`;

    if (isEditing) {
        return (
            <textarea
                ref={textAreaRef}
                value={content}
                onChange={handleContentChange}
                onBlur={handleSave}
                className="w-full h-auto min-h-full p-4 bg-primary-50/50 border-0 outline-none focus:ring-2 focus:ring-primary-500 rounded-lg resize-none prose prose-sm max-w-none prose-p:my-1"
                rows={1}
            />
        );
    }
    return (
        <div
            onDoubleClick={() => setIsEditing(true)}
            className="p-4 h-full w-full prose prose-sm max-w-none prose-p:my-1 cursor-text"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
    );
};


// --- SUB-COMPONENTS for PresentationStudio ---
const SlidePreview: React.FC<{
    slide: Slide;
    project: Project;
    presentation: Presentation;
    isSlides: boolean;
}> = ({ slide, project, presentation, isSlides }) => {
    
    const getItemType = (itemId: string) => {
        if (itemId.startsWith('chart_')) return 'chart';
        if (project.analysis?.kpis.some(k => k.id === itemId)) return 'kpi';
        if (itemId.startsWith('text_')) {
             const textBlock = presentation.textBlocks?.find(t => t.id === itemId);
             return textBlock?.style === 'title' ? 'title' : 'text';
        }
        return 'unknown';
    };

    const maxRows = isSlides ? 8 : 12;

    return (
        <div className={`relative w-full rounded-md bg-white overflow-hidden shadow-sm border border-slate-200 ${isSlides ? 'aspect-video' : 'aspect-[1/1.414]'}`}>
            <div className={`grid grid-cols-12 gap-px`} style={{gridTemplateRows: `repeat(${maxRows}, 1fr)`, height: '100%'}}>
                {slide.layout.map(item => {
                    const type = getItemType(item.i);
                    const rowEnd = Math.min(item.y + item.h, maxRows);
                    const style = {
                        gridColumn: `${item.x + 1} / span ${item.w}`,
                        gridRow: `${item.y + 1} / span ${rowEnd - item.y}`,
                    };
                    let bgColor = 'bg-slate-200';
                    if (type === 'chart') bgColor = 'bg-sky-200';
                    if (type === 'kpi') bgColor = 'bg-emerald-200';
                    if (type === 'text') bgColor = 'bg-slate-300';
                    if (type === 'title') bgColor = 'bg-slate-400';

                    return <div key={item.i} style={style} className={`${bgColor} rounded-sm`}></div>;
                })}
            </div>
        </div>
    );
};

const SlideNavigator: React.FC<{
    slides: Slide[];
    currentPage: number;
    project: Project;
    presentation: Presentation;
    navigatorViewMode: 'filmstrip' | 'list';
    setNavigatorViewMode: (mode: 'filmstrip' | 'list') => void;
    onClose: () => void;
    onSelectPage: (index: number) => void;
    onAddPage: () => void;
    onAddPageWithAI: (prompt: string) => Promise<void>;
    onReorderPages: (newSlides: Slide[]) => void;
    onDeletePage: (index: number) => void;
}> = ({ slides, currentPage, project, presentation, navigatorViewMode, setNavigatorViewMode, onClose, onSelectPage, onAddPage, onAddPageWithAI, onReorderPages, onDeletePage }) => {
    const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
    const [showAiPrompt, setShowAiPrompt] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingSlide, setIsGeneratingSlide] = useState(false);
    const newMenuRef = useRef<HTMLDivElement>(null);
    
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const isSlides = presentation.format === 'slides';
    const pageName = isSlides ? 'Slide' : 'Page';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
                setIsNewMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => { dragItem.current = index; e.dataTransfer.effectAllowed = 'move'; };
    const handleDragEnter = (_: React.DragEvent<HTMLLIElement>, index: number) => { dragOverItem.current = index; };
    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const newSlides = [...slides];
            const draggedItemContent = newSlides.splice(dragItem.current, 1)[0];
            newSlides.splice(dragOverItem.current, 0, draggedItemContent);
            onReorderPages(newSlides);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };
    
    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsGeneratingSlide(true);
        await onAddPageWithAI(aiPrompt);
        setIsGeneratingSlide(false);
        setAiPrompt('');
        setShowAiPrompt(false);
    };

    const getSlideTitle = (slide: Slide) => {
        const allTextBlocks = presentation.textBlocks || [];
        const titleBlock = slide.layout
            .map(item => allTextBlocks.find(tb => tb.id === item.i))
            .find(block => block && block.style === 'title');

        return titleBlock?.content?.trim() || `Untitled ${pageName}`;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg h-full flex flex-col p-3">
            <div className="flex-shrink-0 space-y-3">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                        <button onClick={() => setNavigatorViewMode('filmstrip')} className={`p-1.5 rounded-md ${navigatorViewMode === 'filmstrip' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16} /></button>
                        <button onClick={() => setNavigatorViewMode('list')} className={`p-1.5 rounded-md ${navigatorViewMode === 'list' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={16} /></button>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-md"><X size={16} /></button>
                </div>
                <div className="relative" ref={newMenuRef}>
                    <div className="flex">
                        <button onClick={onAddPage} className="flex-1 px-4 py-2 bg-primary-100/80 text-primary-700 hover:bg-primary-100 rounded-l-lg font-semibold flex items-center justify-center text-sm"><Plus size={16} className="mr-1.5"/> New</button>
                        <button onClick={() => setIsNewMenuOpen(p => !p)} className="px-2 bg-primary-100/80 text-primary-700 hover:bg-primary-100 rounded-r-lg"><ChevronDown size={16} /></button>
                    </div>
                    {isNewMenuOpen && (
                        <div className="absolute top-full mt-2 w-60 bg-white rounded-lg shadow-xl border border-slate-100 py-1.5 z-20">
                            <button onClick={() => { setShowAiPrompt(true); setIsNewMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"><Sparkles size={16} className="mr-3 text-primary-500"/> Add new with AI</button>
                            <button onClick={() => { onAddPage(); setIsNewMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"><File size={16} className="mr-3 text-slate-400"/> Add blank {pageName.toLowerCase()}</button>
                        </div>
                    )}
                </div>

                {showAiPrompt && (
                    <div className="p-2 bg-primary-50 border border-primary-200 rounded-lg">
                        <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder={`Describe the ${pageName.toLowerCase()} you want...`} className="w-full text-sm p-2 border border-slate-300 rounded-md h-20 resize-none focus:ring-primary-500" />
                        <div className="flex justify-end gap-2 mt-2">
                             <button onClick={() => setShowAiPrompt(false)} className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
                             <button onClick={handleAiGenerate} disabled={isGeneratingSlide} className="px-3 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md flex items-center disabled:bg-primary-300">{isGeneratingSlide ? <Loader2 size={12} className="animate-spin mr-1.5"/> : <Send size={12} className="mr-1.5" />} Generate</button>
                        </div>
                    </div>
                )}
            </div>
            
            {navigatorViewMode === 'filmstrip' ? (
                <ul className="flex-1 overflow-y-auto mt-3 -mx-1 px-1 space-y-4 custom-scrollbar">
                    {slides.map((slide, index) => (
                        <li key={slide.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} className="group cursor-pointer relative" onClick={() => onSelectPage(index)}>
                             <div className="flex items-start space-x-2">
                                 <div className={`flex-1 transition-all duration-200 ${currentPage === index ? 'ring-2 ring-primary-500 ring-offset-2 rounded-lg' : ''}`}>
                                    <SlidePreview slide={slide} project={project} presentation={presentation} isSlides={isSlides} />
                                 </div>
                                 <div className="flex flex-col pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="p-1 text-slate-400 cursor-move"><GripVertical size={14} /></div>
                                    <button onClick={(e) => { e.stopPropagation(); onDeletePage(index); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                 </div>
                             </div>
                             <span className="absolute bottom-2 left-2 text-xs font-medium text-slate-500 bg-white/70 px-1.5 py-0.5 rounded">{index + 1}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <ul className="flex-1 overflow-y-auto mt-3 -mx-1 px-1 space-y-1 custom-scrollbar">
                    {slides.map((slide, index) => (
                         <li key={slide.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} className="group cursor-pointer relative" onClick={() => onSelectPage(index)}>
                            <div className={`flex items-center p-2 rounded-md ${currentPage === index ? 'bg-primary-100 text-primary-800' : 'text-slate-700 hover:bg-slate-100'}`}>
                                <span className={`text-xs w-6 text-center flex-shrink-0 ${currentPage === index ? 'font-semibold' : 'text-slate-500'}`}>{index + 1}</span>
                                <span className={`flex-1 truncate text-sm font-medium ${currentPage === index ? 'font-semibold' : ''}`}>{getSlideTitle(slide)}</span>
                                 <button onClick={(e) => { e.stopPropagation(); onDeletePage(index); }} className="ml-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                            </div>
                         </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const DraggableItem: React.FC<{ type: string; id: string; name: string; icon: React.ElementType; }> = ({ type, id, name, icon: Icon }) => (
    <div draggable unselectable="on" onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type, id }))} className="flex items-center p-2 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-grab"><Icon size={16} className="mr-2 text-slate-500" /><span className="text-sm font-medium text-slate-700 truncate">{name}</span></div>
);
const DraggableTextBlock: React.FC<{ style: 'title' | 'body'; name: string; icon: React.ElementType; }> = ({ style, name, icon: Icon }) => (
    <div draggable unselectable="on" onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', style }))} className="flex items-center p-2 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-grab"><Icon size={16} className="mr-2 text-slate-500" /><span className="text-sm font-medium text-slate-700">{name}</span></div>
);

const ContentToolbar: React.FC<{ project: Project }> = ({ project }) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg h-full p-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-base mb-2">Text Blocks</h3>
                    <p className="text-xs text-slate-500 mb-3">Drag elements onto your slide.</p>
                    <div className="space-y-2">
                        <DraggableTextBlock style="title" name="Title" icon={TypeIcon} />
                        <DraggableTextBlock style="body" name="Body Text" icon={AlignJustify} />
                    </div>
                </div>
                <div className="border-t border-slate-200 pt-4">
                    <h3 className="font-bold text-slate-800 text-base mb-3">Dashboard Content</h3>
                    <div className="space-y-2">
                         <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Charts</h4>
                        {project.analysis?.charts.map(c => <DraggableItem key={c.id} type="chart" id={c.id} name={c.title} icon={BarChart3} />)}
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4">KPIs</h4>
                        {project.analysis?.kpis.map(k => <DraggableItem key={k.id} type="kpi" id={k.id} name={k.title} icon={TrendingUp} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN PRESENTATION STUDIO COMPONENT ---

interface PresentationStudioProps {
    project: Project;
    presentation: Presentation;
    onPresentationUpdate: (updatedPresentation: Presentation) => void;
    onBackToHub: () => void;
    onPresent: (presentationId: string) => void;
}

export const ReportStudio: React.FC<PresentationStudioProps> = ({ project, presentation, onPresentationUpdate, onBackToHub, onPresent }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [visibleSlides, setVisibleSlides] = useState<Set<number>>(new Set([0]));
    const [isNavigatorOpen, setIsNavigatorOpen] = useState(true);
    const [navigatorViewMode, setNavigatorViewMode] = useState<'filmstrip' | 'list'>('filmstrip');
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        slideRefs.current = presentation.slides.map(() => null);
        setVisibleSlides(new Set([currentPage]));
    }, [presentation.slides, currentPage]);

    const handleSelectPage = useCallback((index: number) => {
        slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    useEffect(() => {
        const options = {
            root: scrollContainerRef.current,
            rootMargin: '-50% 0px -50% 0px', // Detects when slide is in the vertical center
            threshold: 0.1
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    const index = parseInt(entry.target.getAttribute('data-slide-index') || '0', 10);
                    if (entry.isIntersecting) {
                         setCurrentPage(index);
                    }
                    if(entry.isIntersecting || Math.abs(index - currentPage) <= 1) {
                        setVisibleSlides(prev => new Set(prev).add(index));
                    }
                });
            },
            options
        );

        const currentRefs = slideRefs.current;
        currentRefs.forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => {
            currentRefs.forEach(ref => {
                if (ref) observer.unobserve(ref);
            });
        };
    }, [presentation.slides]);


    const kpiValues = useMemo(() => {
        const values: Record<string, number | null> = {};
        project.analysis?.kpis.forEach(kpi => values[kpi.id] = calculateKpiValue(project.dataSource.data, kpi));
        return values;
    }, [project]);

    const handlePresentationUpdate = (updater: (prev: Presentation) => Presentation) => {
        const updated = updater(presentation);
        onPresentationUpdate(updated);
    };

    const handleNameChange = (newName: string) => {
        handlePresentationUpdate(p => ({ ...p, name: newName }));
    };
    
    const handleAddPageWithAI = useCallback(async (prompt: string) => {
        if (!project.analysis) return;
        try {
            const { newSlide, newTextBlocks } = await addSlideWithAI(
                prompt,
                project.analysis,
                project.name,
                presentation.format === 'slides'
            );
            handlePresentationUpdate(p => ({
                ...p,
                slides: [...p.slides, newSlide],
                textBlocks: [...(p.textBlocks || []), ...newTextBlocks],
            }));
            setTimeout(() => handleSelectPage(presentation.slides.length), 100);
        } catch (err) {
            console.error("Failed to add AI slide", err);
            alert("Sorry, I couldn't generate a slide for that. Please try another prompt.");
        }
    }, [project, presentation, onPresentationUpdate, handleSelectPage]);


    const handleAddPage = () => {
        const newSlide: Slide = { id: `slide_${uuidv4()}`, layout: [] };
        handlePresentationUpdate(p => ({ ...p, slides: [...p.slides, newSlide] }));
        setTimeout(() => handleSelectPage(presentation.slides.length), 100);
    };
    
    const handleDeletePage = (index: number) => {
        if (presentation.slides.length <= 1) {
            alert("Cannot delete the last slide.");
            return;
        }
        handlePresentationUpdate(p => ({ ...p, slides: p.slides.filter((_, i) => i !== index) }));
    };
    
    const handleReorderPages = (newSlides: Slide[]) => {
        handlePresentationUpdate(p => ({ ...p, slides: newSlides }));
    };

    const handleLayoutChange = (index: number, newLayout: ReportLayoutItem[]) => {
        handlePresentationUpdate(p => ({
            ...p,
            slides: p.slides.map((s, i) => i === index ? { ...s, layout: newLayout } : s)
        }));
    };
    
    const onDrop = (index: number, _: ReportLayoutItem[], item: ReportLayoutItem, e: DragEvent) => {
        const data = JSON.parse(e.dataTransfer?.getData('application/json') || '{}');
        if (!data.type) return;

        let newItem: ReportLayoutItem | null = null;
        if (['chart', 'kpi'].includes(data.type)) {
            if (presentation.slides[index].layout.some(l => l.i === data.id)) return;
            newItem = { ...item, i: data.id, w: data.type === 'chart' ? 6 : 3, h: data.type === 'chart' ? 5 : 2 };
        } else if (data.type === 'text') {
            const newBlock: TextBlock = { id: `text_${uuidv4()}`, type: 'text', title: `New ${data.style} Block`, content: '', style: data.style };
            handlePresentationUpdate(p => ({ ...p, textBlocks: [...(p.textBlocks || []), newBlock] }));
            newItem = { ...item, i: newBlock.id, w: data.style === 'title' ? 12 : 6, h: data.style === 'title' ? 1 : 2 };
        }
        
        if (newItem) {
            const newLayout = [...presentation.slides[index].layout, newItem];
            handleLayoutChange(index, newLayout);
        }
    };
    
    const handleRemoveItem = (slideIndex: number, itemId: string) => {
         const newLayout = presentation.slides[slideIndex].layout.filter(item => item.i !== itemId);
         handleLayoutChange(slideIndex, newLayout);
         if (itemId.startsWith('text_')) {
            handlePresentationUpdate(p => ({...p, textBlocks: (p.textBlocks || []).filter(b => b.id !== itemId)}));
         }
    };

    const renderGridItemContent = (item: ReportLayoutItem) => {
        const chart = project.analysis?.charts.find(c => c.id === item.i);
        if (chart) return <div className="w-full h-full"><ChartRenderer config={chart} data={project.dataSource.data} allData={project.dataSource.data} dateColumn={null} onFilterChange={()=>{}} onTimeFilterChange={()=>{}} activeFilters={{}} activeTimeFilter={{type:'all'}} /></div>;

        const kpi = project.analysis?.kpis.find(k => k.id === item.i);
        if (kpi) return <div className="w-full h-full"><ReportKpiCard kpi={kpi} value={kpiValues[kpi.id] ?? null} /></div>;

        const textBlock = presentation.textBlocks?.find(b => b.id === item.i);
        if(textBlock) return <div className="w-full h-full"><EditableTextBlock block={textBlock} onUpdate={b => handlePresentationUpdate(p => ({ ...p, textBlocks: (p.textBlocks || []).map(tb => tb.id === b.id ? b : tb)}))} /></div>;

        return <div className="p-2 text-xs text-red-500 bg-red-50">Content not found for ID: {item.i}</div>;
    }

    const isSlides = presentation.format === 'slides';

    return (
        <div className="flex flex-col h-full w-full bg-slate-100">
            <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 h-16 flex justify-between items-center z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onBackToHub} className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900">
                        <ChevronLeft size={16} className="mr-1" />
                        Back to Hub
                    </button>
                </div>
                <div className="flex-1 text-center min-w-0 px-4">
                    <input 
                        type="text"
                        value={presentation.name}
                        onChange={e => handleNameChange(e.target.value)}
                        className="text-lg font-bold text-slate-800 bg-transparent focus:bg-slate-100 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-primary-300 w-full text-center truncate"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onPresent(presentation.id)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center shadow-sm">
                        <MonitorPlay size={16} className="mr-2" />
                        Present
                    </button>
                </div>
            </header>
            
            <main className="flex-1 relative overflow-hidden min-h-0">
                {/* Central scrollable canvas */}
                <div 
                    ref={scrollContainerRef}
                    className="absolute inset-0 overflow-y-auto custom-scrollbar transition-all duration-300"
                    style={{
                        paddingLeft: isNavigatorOpen ? '18rem' : '5rem', // w-64 (16rem) + ~1rem padding on each side
                        paddingRight: '20rem' // w-72 (18rem) + ~1rem padding on each side
                    }}
                >
                    <div className="mx-auto my-8 space-y-8" style={{maxWidth: '1200px'}}>
                        {presentation.slides.map((slide, index) => {
                             const rowHeight = (isSlides ? 50 : 35);
                             return (
                                <div
                                    key={slide.id}
                                    ref={el => slideRefs.current[index] = el}
                                    data-slide-index={index}
                                    className={`relative bg-white shadow-lg border border-slate-200 ${isSlides ? 'aspect-video' : 'aspect-[1/1.414]'}`}
                                >
                                    {visibleSlides.has(index) ? (
                                        <ResponsiveGridLayout
                                            className="layout"
                                            layouts={{ lg: slide.layout || [] }}
                                            breakpoints={{ lg: 1200 }}
                                            cols={{ lg: 12 }}
                                            rowHeight={rowHeight}
                                            onDrop={(layout, item, e) => onDrop(index, layout, item, e)}
                                            onLayoutChange={(newLayout) => handleLayoutChange(index, newLayout)}
                                            isDroppable={true}
                                            droppingItem={{ i: `new-item_${uuidv4()}`, w: 4, h: 4 }}
                                        >
                                            {(slide.layout || []).map(item => (
                                                <div key={item.i} className="group relative bg-transparent overflow-hidden rounded-lg">
                                                    <div className="w-full h-full">
                                                        {renderGridItemContent(item)}
                                                    </div>
                                                    <button onClick={() => handleRemoveItem(index, item.i)} className="absolute top-1 right-1 p-1 rounded-full bg-white/80 text-slate-500 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all z-20 shadow" title="Remove item"><Trash2 size={12} /></button>
                                                </div>
                                            ))}
                                        </ResponsiveGridLayout>
                                    ) : (
                                        <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-slate-300" /></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Floating UI elements are siblings to the scrollable container */}
                {!isNavigatorOpen && (
                    <button onClick={() => setIsNavigatorOpen(true)} className="absolute top-1/2 -translate-y-1/2 left-4 z-30 p-2 bg-white rounded-lg shadow-lg border border-slate-200 text-slate-600 hover:text-primary-600 hover:bg-primary-50">
                        <LayoutGrid size={20} />
                    </button>
                )}

                <aside className={`absolute top-4 left-4 bottom-4 w-64 z-20 transition-transform duration-300 ease-in-out ${isNavigatorOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'}`}>
                    <SlideNavigator 
                        slides={presentation.slides} 
                        currentPage={currentPage}
                        project={project}
                        presentation={presentation}
                        navigatorViewMode={navigatorViewMode}
                        setNavigatorViewMode={setNavigatorViewMode}
                        onClose={() => setIsNavigatorOpen(false)}
                        onSelectPage={handleSelectPage} 
                        onAddPage={handleAddPage}
                        onAddPageWithAI={handleAddPageWithAI}
                        onDeletePage={handleDeletePage} 
                        onReorderPages={handleReorderPages} 
                    />
                </aside>

                 <aside className="absolute top-4 right-4 bottom-4 w-72 z-10">
                    <ContentToolbar project={project} />
                </aside>
            </main>
        </div>
    );
};