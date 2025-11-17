import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Project, ReportLayoutItem, KpiConfig, ChartConfig, TextBlock, DataRow, Presentation, Slide } from '../types.ts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ChartRenderer } from './charts/ChartRenderer.tsx';
import { v4 as uuidv4 } from 'uuid';
import { BarChart3, TrendingUp, Type, AlignJustify, PlusCircle, File, GripVertical, Trash2, ChevronLeft, MonitorPlay } from 'lucide-react';

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

const SlideNavigator: React.FC<{
    slides: Slide[];
    currentPage: number;
    onSelectPage: (index: number) => void;
    onAddPage: () => void;
    onReorderPages: (newSlides: Slide[]) => void;
    onDeletePage: (index: number) => void;
}> = ({ slides, currentPage, onSelectPage, onAddPage, onReorderPages, onDeletePage }) => {
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, index: number) => { dragOverItem.current = index; };
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

    return (
        <aside className="w-56 bg-white border-r border-slate-200 flex flex-col p-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Slides</h3>
            <ul className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {slides.map((slide, index) => (
                    <li key={slide.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} className="group cursor-pointer">
                        <div className="flex items-start space-x-2">
                            <span className="text-xs font-medium text-slate-400 pt-1">{index + 1}</span>
                            <div onClick={() => onSelectPage(index)} className={`aspect-video w-full rounded-md border-2 p-1 transition-colors ${currentPage === index ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-slate-100 hover:border-slate-400'}`}><div className="w-full h-full bg-white border border-slate-300 rounded-sm flex items-center justify-center"><File size={24} className="text-slate-400" /></div></div>
                            <div className="flex flex-col pt-1">
                                 <button className="p-1 text-slate-400 cursor-move"><GripVertical size={14} /></button>
                                 <button onClick={() => onDeletePage(index)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
             <button onClick={onAddPage} className="mt-3 w-full px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center justify-center">
                <PlusCircle size={14} className="mr-2"/> Add Slide
            </button>
        </aside>
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
        <aside className="w-64 bg-white border-l border-slate-200 p-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-base mb-2">Text Blocks</h3>
                    <p className="text-xs text-slate-500 mb-3">Drag elements onto your slide.</p>
                    <div className="space-y-2">
                        <DraggableTextBlock style="title" name="Title" icon={Type} />
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
        </aside>
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
    const [dynamicRowHeight, setDynamicRowHeight] = useState(0);
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const calculateRowHeight = () => {
            if (canvasRef.current) {
                const canvasWidth = canvasRef.current.offsetWidth;
                setDynamicRowHeight(canvasWidth / 12); 
            }
        };

        const resizeObserver = new ResizeObserver(() => calculateRowHeight());
        if (canvasRef.current) {
            resizeObserver.observe(canvasRef.current);
        }

        calculateRowHeight(); // Initial calculation

        return () => resizeObserver.disconnect();
    }, [presentation.format]);


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

    const handleAddPage = () => {
        const newSlide: Slide = { id: `slide_${uuidv4()}`, layout: [] };
        handlePresentationUpdate(p => ({ ...p, slides: [...p.slides, newSlide] }));
        setCurrentPage(presentation.slides.length);
    };
    
    const handleDeletePage = (index: number) => {
        if (presentation.slides.length <= 1) {
            alert("Cannot delete the last slide.");
            return;
        }
        handlePresentationUpdate(p => ({ ...p, slides: p.slides.filter((_, i) => i !== index) }));
        if (currentPage >= index) setCurrentPage(Math.max(0, currentPage - 1));
    };
    
    const handleReorderPages = (newSlides: Slide[]) => {
        handlePresentationUpdate(p => ({ ...p, slides: newSlides }));
    };

    const handleLayoutChange = (newLayout: ReportLayoutItem[]) => {
        handlePresentationUpdate(p => ({
            ...p,
            slides: p.slides.map((s, i) => i === currentPage ? { ...s, layout: newLayout } : s)
        }));
    };
    
    const onDrop = (_: ReportLayoutItem[], item: ReportLayoutItem, e: DragEvent) => {
        const data = JSON.parse(e.dataTransfer?.getData('application/json') || '{}');
        if (!data.type) return;

        let newItem: ReportLayoutItem | null = null;
        if (['chart', 'kpi'].includes(data.type)) {
            if (presentation.slides[currentPage].layout.some(l => l.i === data.id)) return;
            newItem = { ...item, i: data.id, w: data.type === 'chart' ? 6 : 3, h: data.type === 'chart' ? 5 : 2 };
        } else if (data.type === 'text') {
            const newBlock: TextBlock = { id: `text_${uuidv4()}`, type: 'text', title: `New ${data.style} Block`, content: '', style: data.style };
            handlePresentationUpdate(p => ({ ...p, textBlocks: [...(p.textBlocks || []), newBlock] }));
            newItem = { ...item, i: newBlock.id, w: data.style === 'title' ? 12 : 6, h: data.style === 'title' ? 1 : 2 };
        }
        
        if (newItem) {
            const newLayout = [...presentation.slides[currentPage].layout, newItem];
            handleLayoutChange(newLayout);
        }
    };
    
    const handleRemoveItem = (itemId: string) => {
         const newLayout = presentation.slides[currentPage].layout.filter(item => item.i !== itemId);
         handleLayoutChange(newLayout);
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
        <div className="flex h-full w-full bg-slate-100/70">
            <SlideNavigator 
                slides={presentation.slides} 
                currentPage={currentPage} 
                onSelectPage={setCurrentPage} 
                onAddPage={handleAddPage}
                onDeletePage={handleDeletePage} 
                onReorderPages={handleReorderPages} 
            />
            
            <div className="flex-1 flex flex-col min-h-0">
                <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 h-16 flex justify-between items-center z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100">
                            <ChevronLeft size={16} className="mr-1" />
                            Back to Hub
                        </button>
                        <div className="w-px h-6 bg-slate-200" />
                        <input 
                            type="text"
                            value={presentation.name}
                            onChange={e => handleNameChange(e.target.value)}
                            className="text-lg font-bold text-slate-800 bg-transparent focus:bg-slate-100 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-primary-300 w-96"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onPresent(presentation.id)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center shadow-sm">
                            <MonitorPlay size={16} className="mr-2" />
                            Present
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="mx-auto" style={{maxWidth: '1200px'}}>
                        <div 
                            ref={canvasRef} 
                            className={`relative bg-white shadow-lg border border-slate-200 ${isSlides ? 'aspect-video' : 'aspect-[1/1.414]'}`}
                        >
                             {dynamicRowHeight > 0 && (
                                <ResponsiveGridLayout
                                    className="layout"
                                    layouts={{ lg: presentation.slides[currentPage]?.layout || [] }}
                                    breakpoints={{ lg: 1200 }} cols={{ lg: 12 }}
                                    rowHeight={dynamicRowHeight}
                                    onDrop={onDrop}
                                    onLayoutChange={handleLayoutChange}
                                    isDroppable={true}
                                    droppingItem={{ i: `new-item_${uuidv4()}`, w: 4, h: 4 }}
                                >
                                     {(presentation.slides[currentPage]?.layout || []).map(item => (
                                        <div key={item.i} className="group relative bg-transparent overflow-hidden rounded-lg">
                                            <div className="w-full h-full">
                                                {renderGridItemContent(item)}
                                            </div>
                                            <button onClick={() => handleRemoveItem(item.i)} className="absolute top-1 right-1 p-1 rounded-full bg-white/80 text-slate-500 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all z-20 shadow" title="Remove item"><Trash2 size={12} /></button>
                                        </div>
                                    ))}
                                </ResponsiveGridLayout>
                            )}
                        </div>
                         {!isSlides && (
                            <div className="text-center mt-6">
                                <button onClick={handleAddPage} className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium shadow-sm border border-slate-300 flex items-center mx-auto">
                                    <PlusCircle size={16} className="mr-2" />
                                    Add blank card
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <ContentToolbar project={project} />
        </div>
    );
};
