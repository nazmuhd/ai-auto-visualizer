
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Project, ReportLayoutItem, KpiConfig, ContentBlock, DataRow, Presentation, Slide, ChartType, LayoutId, PresentationTheme } from '../types.ts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ChartRenderer } from './charts/ChartRenderer.tsx';
import { v4 as uuidv4 } from 'uuid';
import { exportPresentationToPptx } from '../services/pptxEngine.ts';
import { 
    BarChart3, TrendingUp, Type as TypeIcon, Plus, ChevronLeft, MonitorPlay, X, Loader2, 
    LineChart, PieChart, ScatterChart, Download,
    ListOrdered, ListTodo, AlertTriangle, Heading1, Heading2, Quote, MessageSquare, Palette, CheckSquare,
    Image as ImageIcon, Film, Table as TableIcon, Shapes, Circle, Square, Triangle, ArrowRight, PlayCircle, Info, List, Trash2, Edit3,
    Grid, Film as FilmIcon, Layout, AlignLeft, MessageSquareText, Section, MoreHorizontal
} from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);
const DROPPING_ITEM_ID = '__dropping-elem__';

// --- HELPER FUNCTIONS ---

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

const getIconForChartType = (type: ChartType) => {
    switch (type) {
        case 'bar': case 'stacked-bar': return BarChart3;
        case 'line': case 'area': return LineChart;
        case 'pie': return PieChart;
        case 'scatter': case 'bubble': return ScatterChart;
        case 'combo': return BarChart3;
        default: return BarChart3;
    }
};

const DEFAULT_THEME: PresentationTheme = {
    colors: {
        accent1: '#0284c7', accent2: '#0ea5e9', accent3: '#38bdf8', accent4: '#7dd3fc', accent5: '#bae6fd', accent6: '#e0f2fe',
        background: '#FFFFFF', text: '#333333'
    },
    fonts: { heading: 'Inter', body: 'Inter' }
};

// --- COMPONENT: KPI CARD ---
const ReportKpiCard: React.FC<{ kpi: KpiConfig, value: number | null }> = ({ kpi, value }) => {
    const formattedValue = value !== null ? new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(value) : '-';
    return (
        <div className="p-4 bg-white rounded-lg border border-slate-200 h-full flex flex-col justify-center text-center shadow-sm select-none">
            <p className="text-sm font-medium text-slate-500 mb-1 truncate">{kpi.title}</p>
            <p className="text-3xl font-bold text-slate-900">{formattedValue}</p>
        </div>
    );
};

// --- COMPONENT: CONTENT BLOCK RENDERER ---
const ContentBlockRenderer: React.FC<{ block: ContentBlock, theme: PresentationTheme, onUpdate: (updatedBlock: ContentBlock) => void }> = ({ block, theme, onUpdate }) => {
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

    // --- RENDERERS BY TYPE ---

    if (block.type === 'image') {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg overflow-hidden relative group">
                {block.content ? (
                    <img src={block.content} alt="Slide Content" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center text-slate-400">
                        <ImageIcon size={48} className="mx-auto mb-2 opacity-50"/>
                        <p className="text-sm font-medium">Double-click to set image URL</p>
                    </div>
                )}
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" onDoubleClick={(e) => {
                     e.stopPropagation();
                     const url = prompt("Enter Image URL:", block.content);
                     if (url) onUpdate({ ...block, content: url });
                 }}></div>
                 <button 
                     onMouseDown={(e) => e.stopPropagation()} 
                     onClick={(e) => {
                        e.stopPropagation();
                        const url = prompt("Enter Image URL:", block.content);
                        if (url) onUpdate({ ...block, content: url });
                     }}
                     className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full shadow-sm border border-slate-200 text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all z-10"
                 >
                    <Edit3 size={14} />
                 </button>
            </div>
        );
    }

    if (block.type === 'video') {
         return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 rounded-lg overflow-hidden relative group">
                <div className="text-center text-slate-500">
                    <PlayCircle size={64} className="mx-auto mb-2 text-white opacity-80"/>
                    <p className="text-sm font-medium text-slate-400">{block.content || "No Video Source"}</p>
                </div>
                <div className="absolute inset-0 bg-white/0 hover:bg-white/5 transition-colors cursor-pointer" onDoubleClick={(e) => {
                     e.stopPropagation();
                     const url = prompt("Enter Video URL:", block.content);
                     if (url) onUpdate({ ...block, content: url });
                 }}></div>
                 <button 
                     onMouseDown={(e) => e.stopPropagation()} 
                     onClick={(e) => {
                        e.stopPropagation();
                        const url = prompt("Enter Video URL:", block.content);
                        if (url) onUpdate({ ...block, content: url });
                     }}
                     className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full shadow-sm border border-slate-200 text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all z-10"
                 >
                    <Edit3 size={14} />
                 </button>
            </div>
        );
    }
    
    if (block.type === 'shape') {
         const fillColor = block.fill || theme.colors.accent2;
         return (
            <div className="h-full w-full flex items-center justify-center relative group">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ fill: fillColor, opacity: block.opacity || 1 }}>
                    {block.style === 'circle' && <circle cx="50" cy="50" r="48" />}
                    {block.style === 'triangle' && <polygon points="50,5 95,95 5,95" />}
                    {block.style === 'arrow' && <path d="M10,35 L60,35 L60,10 L95,50 L60,90 L60,65 L10,65 Z" />}
                    {(block.style === 'rect' || !block.style) && <rect x="2" y="2" width="96" height="96" rx="8" />}
                </svg>
                {block.isPlaceholder && (
                    <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-slate-300 rounded m-2">
                         <Shapes className="text-slate-300" />
                    </div>
                )}
            </div>
        );
    }

    if (block.type === 'table') {
         return (
            <div className="h-full w-full bg-white border border-slate-300 rounded shadow-sm overflow-hidden flex flex-col group">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">Table Placeholder</div>
                <div className="flex-1 p-2 grid grid-cols-3 gap-px bg-slate-200 border border-slate-200">
                    {[...Array(9)].map((_, i) => <div key={i} className="bg-white"></div>)}
                </div>
            </div>
        );
    }

    // --- TEXT RENDERER ---
    
    const renderTextContent = () => {
        const text = content || (isEditing ? '' : 'Double-click to edit...');
        
        if (block.style === 'bullet') {
            return <ul className="list-disc pl-5 space-y-1 text-slate-700">{text.split('\n').filter(l => l.trim()).map((l, i) => <li key={i}>{l.replace(/^[-*] /, '')}</li>)}</ul>;
        }
        if (block.style === 'number') {
            return <ol className="list-decimal pl-5 space-y-1 text-slate-700">{text.split('\n').filter(l => l.trim()).map((l, i) => <li key={i}>{l.replace(/^\d+\. /, '')}</li>)}</ol>;
        }
        if (block.style === 'todo') {
             return <div className="space-y-2">{text.split('\n').filter(l => l.trim()).map((l, i) => <div key={i} className="flex items-center text-slate-700"><CheckSquare size={16} className="text-slate-300 mr-2"/><span>{l.replace(/^\[ \] /, '')}</span></div>)}</div>;
        }
        
        const htmlContent = text.replace(/\n/g, '<br />');
        const colorStyle = { color: theme.colors.text };

        switch (block.style) {
            case 'title': return <h1 className="text-4xl font-bold leading-tight" style={{ color: theme.colors.accent1 }} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
            case 'h1': return <h1 className="text-3xl font-bold leading-snug" style={colorStyle} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
            case 'h2': return <h2 className="text-2xl font-semibold leading-snug" style={{ color: theme.colors.accent2 }} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
            case 'quote': return <blockquote className="border-l-4 pl-4 italic text-lg" style={{ borderColor: theme.colors.accent1, color: theme.colors.text }} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
            case 'note': return <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-900 flex items-start h-full"><Info className="w-5 h-5 mr-2 flex-shrink-0 text-blue-600 mt-0.5"/><div className="flex-1"><p className="font-bold text-sm mb-1">Note</p><div className="text-sm opacity-90" dangerouslySetInnerHTML={{ __html: htmlContent }} /></div></div>;
            case 'warning': return <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-900 flex items-start h-full"><AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 text-amber-600 mt-0.5"/><div className="flex-1"><p className="font-bold text-sm mb-1">Warning</p><div className="text-sm opacity-90" dangerouslySetInnerHTML={{ __html: htmlContent }} /></div></div>;
            default: return <div className="text-slate-700 leading-relaxed" style={colorStyle} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
        }
    };

    if (isEditing) {
        return (
             <div className="bg-white rounded-lg border-2 border-primary-400 shadow-sm w-full h-full overflow-hidden flex flex-col z-50 relative nodrag" onMouseDown={e => e.stopPropagation()}>
                <div className="bg-slate-50 px-2 py-1 border-b border-slate-100 text-xs text-slate-500 uppercase font-bold tracking-wider flex justify-between items-center">
                    <span>Editing {block.style}</span>
                    <button onMouseDown={handleSave} className="text-primary-600 hover:text-primary-700 px-2 py-0.5 rounded hover:bg-primary-50">Done</button>
                </div>
                <textarea
                    ref={textAreaRef}
                    value={content}
                    onChange={handleContentChange}
                    onBlur={handleSave}
                    placeholder="Type here..."
                    className="w-full flex-1 p-4 border-0 outline-none resize-none text-slate-800 bg-white text-sm"
                    style={{ minHeight: '60px' }}
                />
            </div>
        );
    }
    
    const isPlaceholder = !content && !isEditing;
    return (
        <div 
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
            className="h-full w-full cursor-text group relative"
        >
            <div className={`h-full w-full ${!isPlaceholder ? '' : 'flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50'}`}>
                {isPlaceholder ? <span className="text-slate-400 italic text-sm pointer-events-none">Double-click to add content</span> : renderTextContent()}
            </div>
            <button 
                 onMouseDown={(e) => e.stopPropagation()} 
                 onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                 className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full shadow-sm border border-slate-200 text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all z-10"
             >
                <Edit3 size={14} />
            </button>
        </div>
    );
};

// --- COMPONENT: SLIDE PREVIEW (LEFT SIDEBAR) ---
const SlidePreview: React.FC<{
    slide: Slide;
    index: number;
    isActive: boolean;
    project: Project;
    presentation: Presentation;
    isSlides: boolean;
    viewMode: 'grid' | 'list';
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onAddSection: (e: React.MouseEvent) => void;
}> = ({ slide, index, isActive, project, presentation, isSlides, viewMode, onClick, onDelete, onAddSection }) => {
    
    const getItemType = (itemId: string) => {
        if (itemId.startsWith('chart_')) return 'chart';
        if (project.analysis?.kpis.some(k => k.id === itemId)) return 'kpi';
        const block = (presentation.blocks || []).find(b => b.id === itemId);
        if (block) return block.type;
        return 'unknown';
    };

    const maxRows = isSlides ? 8 : 12;

    // Try to find a title block for the list view
    const slideTitle = slide.layout.find(item => {
        const block = (presentation.blocks || []).find(b => b.id === item.i);
        return block && block.type === 'text' && (block.style === 'title' || block.style === 'h1');
    });
    const titleText = slideTitle 
        ? (presentation.blocks || []).find(b => b.id === slideTitle.i)?.content 
        : `Slide ${index + 1}`;

    return (
        <>
            {slide.sectionTitle && (
                <div className="px-1 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                    <Section size={12} className="mr-1"/> {slide.sectionTitle}
                </div>
            )}
            {viewMode === 'list' ? (
                 <div 
                    onClick={onClick}
                    className={`group cursor-pointer flex items-center p-2 rounded-lg mb-1 transition-colors ${isActive ? 'bg-primary-50 text-primary-900' : 'hover:bg-slate-100 text-slate-700'}`}
                >
                    <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-xs font-bold mr-2 ${isActive ? 'bg-primary-200 text-primary-800' : 'bg-slate-200 text-slate-600'}`}>
                        {index + 1}
                    </span>
                    <span className="text-sm font-medium truncate flex-1">{titleText || 'Untitled Slide'}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex">
                         <button onClick={onAddSection} title="Start Section Here" className="text-slate-400 hover:text-primary-500 p-1 rounded hover:bg-slate-200"><Section size={12}/></button>
                         {presentation.slides.length > 1 && <button onClick={onDelete} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50"><Trash2 size={12} /></button>}
                    </div>
                </div>
            ) : (
                <div 
                    onClick={onClick}
                    className={`relative group cursor-pointer transition-all duration-200 rounded-lg p-2 ${isActive ? 'bg-primary-50 ring-1 ring-primary-200' : 'hover:bg-slate-100'}`}
                >
                     <div className="flex items-center justify-between mb-1.5 px-1">
                         <span className={`text-xs font-bold w-5 ${isActive ? 'text-primary-700' : 'text-slate-400'}`}>{index + 1}</span>
                         <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                             <button onClick={onAddSection} title="Start Section Here" className="text-slate-400 hover:text-primary-500 p-1 rounded hover:bg-slate-200 transition-opacity"><Section size={12}/></button>
                             {presentation.slides.length > 1 && <button onClick={onDelete} className="text-slate-400 hover:text-red-500 transition-opacity p-1 rounded hover:bg-red-50"><Trash2 size={12} /></button>}
                         </div>
                     </div>
                     <div className={`relative w-full rounded bg-white border ${isActive ? 'border-primary-300 shadow-md' : 'border-slate-200 shadow-sm'} overflow-hidden aspect-video pointer-events-none`}>
                        <div className="absolute inset-0 transform scale-[0.2] origin-top-left w-[500%] h-[500%]">
                            <div className={`grid grid-cols-12 gap-2 p-2 h-full bg-white`} style={{gridTemplateRows: `repeat(${maxRows}, 1fr)`}}>
                                {slide.layout.map(item => {
                                    const type = getItemType(item.i);
                                    const style: React.CSSProperties = {
                                        gridColumn: `${item.x + 1} / span ${item.w}`,
                                        gridRow: `${item.y + 1} / span ${item.h}`,
                                    };
                                    let bgColor = 'bg-slate-100';
                                    let borderColor = 'border-slate-200';
                                    
                                    if (type === 'chart') { bgColor = 'bg-sky-100'; borderColor = 'border-sky-200'; }
                                    if (type === 'kpi') { bgColor = 'bg-emerald-50'; borderColor = 'border-emerald-200'; }
                                    if (type === 'text') { bgColor = 'bg-slate-50'; borderColor = 'border-slate-200'; }
                                    if (type === 'image' || type === 'video') { bgColor = 'bg-purple-100'; borderColor = 'border-purple-200'; }
                                    if (type === 'shape') { bgColor = 'bg-orange-100'; borderColor = 'border-orange-200'; }

                                    return <div key={item.i} style={style} className={`${bgColor} border ${borderColor} rounded-sm shadow-sm`}></div>;
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// --- COMPONENT: TOOLBOX ITEM (RIGHT SIDEBAR) ---
const FlyoutItem: React.FC<{
    label: string;
    description?: string;
    icon: React.ElementType;
    iconNode?: React.ReactNode;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ label, description, icon: Icon, iconNode, onDragStart }) => (
    <div
        draggable
        onDragStart={onDragStart}
        className="flex items-center p-3 mb-2 rounded-lg border border-slate-200 bg-white hover:border-primary-400 hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 select-none group"
    >
        <div className="mr-3 text-slate-400 group-hover:text-primary-500 transition-colors">
            {iconNode ? iconNode : <Icon size={20} />}
        </div>
        <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-slate-700 block truncate">{label}</span>
            {description && <span className="text-xs text-slate-400 block mt-0.5 truncate">{description}</span>}
        </div>
    </div>
);

// --- COMPONENT: ICON NAVIGATION RAIL (RIGHT SIDEBAR) ---
const IconToolbar: React.FC<{ activePanel: string | null; setActivePanel: (panel: string | null) => void }> = ({ activePanel, setActivePanel }) => (
    <div className="bg-white rounded-full border border-slate-200 flex flex-col items-center py-3 px-2 space-y-2 shadow-xl z-20">
        <button onClick={() => setActivePanel(activePanel === 'text' ? null : 'text')} title="Text" className={`p-2.5 rounded-full transition-all duration-200 ${activePanel === 'text' ? 'bg-primary-100 text-primary-600 shadow-inner' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}><TypeIcon size={20} /></button>
        <button onClick={() => setActivePanel(activePanel === 'charts' ? null : 'charts')} title="Charts" className={`p-2.5 rounded-full transition-all duration-200 ${activePanel === 'charts' ? 'bg-primary-100 text-primary-600 shadow-inner' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}><BarChart3 size={20} /></button>
        <button onClick={() => setActivePanel(activePanel === 'images' ? null : 'images')} title="Images" className={`p-2.5 rounded-full transition-all duration-200 ${activePanel === 'images' ? 'bg-primary-100 text-primary-600 shadow-inner' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}><ImageIcon size={20} /></button>
        <button onClick={() => setActivePanel(activePanel === 'media' ? null : 'media')} title="Media" className={`p-2.5 rounded-full transition-all duration-200 ${activePanel === 'media' ? 'bg-primary-100 text-primary-600 shadow-inner' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}><Film size={20} /></button>
        <button onClick={() => setActivePanel(activePanel === 'shapes' ? null : 'shapes')} title="Shapes" className={`p-2.5 rounded-full transition-all duration-200 ${activePanel === 'shapes' ? 'bg-primary-100 text-primary-600 shadow-inner' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}><Shapes size={20} /></button>
        <button onClick={() => setActivePanel(activePanel === 'tables' ? null : 'tables')} title="Tables" className={`p-2.5 rounded-full transition-all duration-200 ${activePanel === 'tables' ? 'bg-primary-100 text-primary-600 shadow-inner' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}><TableIcon size={20} /></button>
        <div className="w-8 h-px bg-slate-200 my-1"></div>
        <button onClick={() => setActivePanel(activePanel === 'theme' ? null : 'theme')} title="Theme" className={`p-2.5 rounded-full transition-all duration-200 ${activePanel === 'theme' ? 'bg-primary-100 text-primary-600 shadow-inner' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}><Palette size={20} /></button>
    </div>
);

// --- COMPONENT: FLYOUT PANEL (RIGHT SIDEBAR CONTENT) ---
const FlyoutPanel: React.FC<{ activePanel: string | null; project: Project; presentation: Presentation; onUpdateTheme: (colors: any) => void; onClose: () => void; }> = ({ activePanel, project, presentation, onUpdateTheme, onClose }) => {
    
    const getPanelTitle = () => {
        switch(activePanel) {
            case 'text': return 'Text Elements';
            case 'charts': return 'Data Visualization';
            case 'images': return 'Images';
            case 'media': return 'Video & Audio';
            case 'shapes': return 'Shapes & Icons';
            case 'tables': return 'Tables';
            case 'theme': return 'Theme Settings';
            default: return 'Toolbox';
        }
    };
    
    const theme = presentation.theme || DEFAULT_THEME;

    return (
        <div className="h-full flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <header className="px-4 py-3 border-b border-slate-100 flex justify-between items-center flex-shrink-0 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm">{getPanelTitle()}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"><X size={16}/></button>
            </header>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                {activePanel === 'text' && (
                    <>
                        <section>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Basic blocks</h4>
                            <div className="grid grid-cols-2 gap-2">
                                 <FlyoutItem label="Title" icon={TypeIcon} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', style: 'title' }))} />
                                 <FlyoutItem label="Heading 1" icon={Heading1} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', style: 'h1' }))} />
                                 <FlyoutItem label="Heading 2" icon={Heading2} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', style: 'h2' }))} />
                                 <FlyoutItem label="Body" icon={TypeIcon} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', style: 'body' }))} />
                            </div>
                        </section>
                        <section>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lists</h4>
                            <div className="space-y-2">
                                 <FlyoutItem label="Bulleted list" icon={List} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', style: 'bullet' }))} />
                                 <FlyoutItem label="Numbered list" icon={ListOrdered} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', style: 'number' }))} />
                                 <FlyoutItem label="Todo list" icon={ListTodo} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', style: 'todo' }))} />
                            </div>
                        </section>
                        <section>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Callouts</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <FlyoutItem label="Note" icon={MessageSquare} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', style: 'note' }))} />
                                <FlyoutItem label="Warning" icon={AlertTriangle} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', style: 'warning' }))} />
                                <FlyoutItem label="Quote" icon={Quote} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', style: 'quote' }))} />
                            </div>
                        </section>
                    </>
                )}

                {activePanel === 'charts' && (
                    <>
                        <section>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">My Charts</h4>
                             <div className="space-y-2">
                                {(project.analysis?.charts || []).map(chart => 
                                    <FlyoutItem key={chart.id} label={chart.title} description={chart.type} icon={getIconForChartType(chart.type)} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'chart', id: chart.id }))} />
                                )}
                                {(!project.analysis?.charts || project.analysis.charts.length === 0) && <p className="text-xs text-slate-400 italic text-center py-2">No charts available.</p>}
                            </div>
                        </section>
                        <section>
                             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">KPIs</h4>
                             <div className="space-y-2">
                                {(project.analysis?.kpis || []).map(kpi => 
                                    <FlyoutItem key={kpi.id} label={kpi.title} description={`${kpi.operation} of ${kpi.column}`} icon={TrendingUp} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'kpi', id: kpi.id }))} />
                                )}
                            </div>
                        </section>
                    </>
                )}

                {activePanel === 'images' && (
                    <section>
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Insert Image</h4>
                         <FlyoutItem label="Image Placeholder" icon={ImageIcon} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'image', content: '' }))} />
                         <p className="text-xs text-slate-400 mt-4 text-center px-4">Drag the placeholder to the slide, then double-click it to set the URL.</p>
                    </section>
                )}

                {activePanel === 'media' && (
                    <section>
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Video</h4>
                         <FlyoutItem label="Video Player" icon={Film} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'video', content: '' }))} />
                    </section>
                )}

                {activePanel === 'shapes' && (
                    <section>
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Basic Shapes</h4>
                         <div className="grid grid-cols-2 gap-2">
                             <FlyoutItem label="Rectangle" icon={Square} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'shape', style: 'rect' }))} />
                             <FlyoutItem label="Circle" icon={Circle} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'shape', style: 'circle' }))} />
                             <FlyoutItem label="Triangle" icon={Triangle} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'shape', style: 'triangle' }))} />
                             <FlyoutItem label="Arrow" icon={ArrowRight} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'shape', style: 'arrow' }))} />
                         </div>
                    </section>
                )}

                {activePanel === 'tables' && (
                    <section>
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tables</h4>
                         <FlyoutItem label="Basic Table" icon={TableIcon} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'table' }))} />
                    </section>
                )}

                {activePanel === 'theme' && (
                    <section className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Brand Colors</h4>
                        <div className="space-y-3">
                             {Object.entries(theme.colors).map(([key, val]) => (
                                 key.startsWith('accent') && (
                                     <div key={key} className="flex items-center justify-between">
                                         <span className="text-sm capitalize text-slate-600">{key}</span>
                                         <input type="color" value={val} onChange={(e) => onUpdateTheme({ [key]: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-slate-200" />
                                     </div>
                                 )
                             ))}
                             <div className="flex items-center justify-between border-t pt-2">
                                 <span className="text-sm text-slate-600">Background</span>
                                 <input type="color" value={theme.colors.background} onChange={(e) => onUpdateTheme({ background: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-slate-200" />
                             </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT: REPORT STUDIO ---
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
        
        // Define Basic Placeholders
        if (choice === '2') { 
            layoutId = 'TITLE_SLIDE'; 
            // Title Placeholder (Ghost Block)
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
            // Default Title & Content
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
