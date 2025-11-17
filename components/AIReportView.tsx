import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Project, ReportLayoutItem, KpiConfig, ChartConfig, TextBlock, DataRow } from '../types.ts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ChartRenderer, TimeFilterPreset } from './charts/ChartRenderer.tsx';
import { BarChart3, TrendingUp, Type, X, PlusCircle, Trash2, MoreVertical, Edit2, AlertTriangle, Sparkles, Loader2, MessageSquare, ListChecks, Pencil, ChevronsLeft, GripVertical, FileText, Check, Tv, AlignJustify } from 'lucide-react';
import { generateChartInsight, improveText } from '../services/geminiService.ts';
import { v4 as uuidv4 } from 'uuid';

const ResponsiveGridLayout = WidthProvider(Responsive);

// --- UTILITY & DATA FUNCTIONS ---
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

const filterData = (data: DataRow[], filters: Record<string, Set<string>>, timeFilter: { type: TimeFilterPreset; start?: string; end?: string }, dateColumn: string | null): DataRow[] => {
    let result = data;
    if (dateColumn && timeFilter.type !== 'all') {
        // ... (Time filter logic would go here if needed per chart)
    }
    Object.entries(filters).forEach(([col, allowedValues]) => {
        if (allowedValues.size > 0) {
            result = result.filter(row => allowedValues.has(String(row[col])));
        }
    });
    return result;
};


// --- REUSABLE UI COMPONENTS ---
const ReportKpiCard: React.FC<{ kpi: KpiConfig, value: number | null }> = ({ kpi, value }) => {
    const formattedValue = value !== null ? new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(value) : '-';
    return (
        <div className="p-4 bg-white rounded-lg border border-slate-200 h-full flex flex-col justify-center text-center">
            <p className="text-sm font-medium text-slate-500 mb-1 truncate">{kpi.title}</p>
            <p className="text-3xl font-bold text-slate-900">{formattedValue}</p>
        </div>
    );
};

const EditableTextBlock: React.FC<{ block: TextBlock, onUpdate: (updatedBlock: TextBlock) => void, pageContext?: { page: number, total: number } }> = ({ block, onUpdate, pageContext }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(block.content);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { setContent(block.content); }, [block.content]);
    useEffect(() => { if (isEditing) { textAreaRef.current?.focus(); textAreaRef.current?.select(); } }, [isEditing]);

    const handleSave = () => { onUpdate({ ...block, content }); setIsEditing(false); };
    
    const renderedContent = useMemo(() => {
        let finalContent = content;
        if (pageContext) {
            finalContent = finalContent.replace(/%page%/g, String(pageContext.page)).replace(/%total%/g, String(pageContext.total));
        }
        return finalContent.replace(/\n/g, '<br />') || `<p class="text-slate-400 italic">Double-click to edit...</p>`;
    }, [content, pageContext]);

    const textStyle = useMemo(() => {
        switch(block.style) {
            case 'title': return 'prose-xl prose-h1:font-bold prose-h1:mb-0';
            case 'subtitle': return 'prose-lg text-slate-600';
            default: return 'prose-sm prose-p:my-1';
        }
    }, [block.style]);

    if (isEditing) {
        return (
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 h-full">
                <textarea ref={textAreaRef} value={content} onChange={(e) => setContent(e.target.value)} onBlur={handleSave} className={`w-full h-full border-none outline-none resize-none ${textStyle}`} />
            </div>
        );
    }
    return <div onDoubleClick={() => setIsEditing(true)} className={`p-4 bg-white rounded-lg border border-transparent h-full prose max-w-none ${textStyle}`} dangerouslySetInnerHTML={{ __html: renderedContent }} />;
};

const DeletePageConfirmationModal: React.FC<{ pageNumber: number, onConfirm: () => void, onClose: () => void }> = ({ pageNumber, onConfirm, onClose }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
        <div role="dialog" className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" /></div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Delete Page {pageNumber}</h3>
                    <p className="mt-2 text-sm text-slate-500">Are you sure? This action cannot be undone.</p>
                </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button onClick={onConfirm} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm">Delete</button>
                <button onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
            </div>
        </div>
    </div>
);

// --- SPECIALIZED COMPONENTS FOR REPORT STUDIO ---

// FIX: Moved component definition outside of parent component to prevent re-creation on render.
const DraggableItem: React.FC<{ type: string; id: string; name: string; icon: React.ElementType; }> = ({ type, id, name, icon: Icon }) => (
    <div draggable unselectable="on" onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type, id }))} className="flex items-center p-2 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-grab"><Icon size={16} className="mr-2 text-slate-500" /><span className="text-sm font-medium text-slate-700 truncate">{name}</span></div>
);
// FIX: Moved component definition outside of parent component to prevent re-creation on render.
const DraggableTextBlock: React.FC<{ style: 'title' | 'subtitle' | 'body'; name: string; icon: React.ElementType; }> = ({ style, name, icon: Icon }) => (
    <div draggable unselectable="on" onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'text', style }))} className="flex items-center p-2 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-grab"><Icon size={16} className="mr-2 text-slate-500" /><span className="text-sm font-medium text-slate-700">{name}</span></div>
);

interface AiMenuItemProps {
    icon: React.ElementType;
    text: string;
    action: () => void;
    loadingKey: string;
    aiLoading: string | null;
}
const AiMenuItem: React.FC<AiMenuItemProps> = ({ icon: Icon, text, action, loadingKey, aiLoading }) => (
    <button onClick={action} disabled={!!aiLoading} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center disabled:opacity-50">
        {aiLoading === loadingKey ? <Loader2 size={14} className="mr-2 animate-spin"/> : <Icon size={14} className="mr-2 text-slate-400" />}
        {text}
    </button>
);


const ContentPanel: React.FC<{ project: Project; isCollapsed: boolean; onToggle: () => void }> = ({ project, isCollapsed, onToggle }) => {
    return (
        <aside className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 p-0' : 'w-64 p-4'}`}>
            <div className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                <div className="space-y-4 overflow-hidden">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">Add Content</h3>
                        <p className="text-xs text-slate-500 mb-2">Drag and drop elements onto your report page.</p>
                        <div className="space-y-2">
                            <DraggableTextBlock style="title" name="Title" icon={Type} />
                            <DraggableTextBlock style="body" name="Body Text" icon={AlignJustify} />
                        </div>
                    </div>
                    <div className="border-t border-slate-200 pt-4">
                        <h3 className="font-bold text-slate-800 text-lg mb-2">Charts & KPIs</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {project.analysis?.charts.map(c => <DraggableItem key={c.id} type="chart" id={c.id} name={c.title} icon={BarChart3} />)}
                            {project.analysis?.kpis.map(k => <DraggableItem key={k.id} type="kpi" id={k.id} name={k.title} icon={TrendingUp} />)}
                        </div>
                    </div>
                </div>
            </div>
            <button onClick={onToggle} title={isCollapsed ? "Expand" : "Collapse"} className="absolute top-1/2 -translate-y-1/2 -right-3 z-10 p-1.5 rounded-full bg-white border border-slate-300 text-slate-500 hover:bg-slate-100"><ChevronsLeft size={16} className={`transition-transform duration-300 ${isCollapsed && 'rotate-180'}`} /></button>
        </aside>
    );
};

interface CanvasProps {
    project: Project;
    layouts: ReportLayoutItem[][];
    currentPage: number;
    onLayoutChange: (newLayout: ReportLayoutItem[]) => void;
    onDrop: (layout: ReportLayoutItem[], item: ReportLayoutItem, e: DragEvent) => void;
    renderGridItem: (item: ReportLayoutItem) => React.ReactElement;
}
const Canvas: React.FC<CanvasProps> = ({ project, layouts, currentPage, onLayoutChange, onDrop, renderGridItem }) => {
    const isSlides = project.reportFormat === 'slides';
    const canvasClass = isSlides ? 'aspect-video w-full max-w-6xl bg-white shadow-lg my-auto' : 'w-full bg-white shadow-lg';
    const pageClass = isSlides ? '' : 'aspect-[1/1.414] w-full max-w-4xl mx-auto my-4 border border-slate-200';

    return (
        <div className={`flex-1 overflow-auto p-4 flex ${isSlides ? 'items-center justify-center' : 'flex-col'}`}>
            <div className={canvasClass}>
                <div className={pageClass}>
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={{ lg: layouts[currentPage] || [] }}
                        breakpoints={{ lg: 1200 }} cols={{ lg: 12 }}
                        rowHeight={isSlides ? 50 : 40}
                        onDrop={onDrop}
                        onLayoutChange={onLayoutChange}
                        onDragStop={onLayoutChange}
                        onResizeStop={onLayoutChange}
                        isDroppable={true}
                        droppingItem={{ i: 'new-item', w: 4, h: 2 }}
                    >
                        {(layouts[currentPage] || []).map(renderGridItem)}
                    </ResponsiveGridLayout>
                </div>
            </div>
        </div>
    );
};

// --- MAIN REPORT STUDIO COMPONENT ---

export const ReportStudio: React.FC<{ project: Project; onUpdateProject: (updater: (p: Project) => Project) => void }> = ({ project, onUpdateProject }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [layouts, setLayouts] = useState<ReportLayoutItem[][]>(project.reportLayout || [[]]);
    const [pageToDelete, setPageToDelete] = useState<number | null>(null);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    // In-report filtering state
    const [reportFilters, setReportFilters] = useState<Record<string, Set<string>>>({});
    const [reportTimeFilter, setReportTimeFilter] = useState<{ type: TimeFilterPreset; start?: string; end?: string }>({ type: 'all' });
    
    // Menu states
    const [itemMenu, setItemMenu] = useState<string | null>(null);
    const [aiMenuOpen, setAiMenuOpen] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const aiMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setLayouts(project.reportLayout || [[]]); }, [project.reportLayout]);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setItemMenu(null);
            if (aiMenuRef.current && !aiMenuRef.current.contains(e.target as Node)) setAiMenuOpen(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onUpdateLayout = (newLayouts: ReportLayoutItem[][]) => {
        setLayouts(newLayouts);
        onUpdateProject(p => ({ ...p, reportLayout: newLayouts }));
    };

    const kpiValues = useMemo(() => {
        const values: Record<string, number | null> = {};
        project.analysis?.kpis.forEach(kpi => values[kpi.id] = calculateKpiValue(project.dataSource.data, kpi));
        return values;
    }, [project.analysis?.kpis, project.dataSource.data]);

    const handleAddPage = () => { onUpdateLayout([...layouts, []]); setCurrentPage(layouts.length); };
    const handleDeletePage = (index: number) => {
        const newLayouts = layouts.filter((_, i) => i !== index);
        onUpdateLayout(newLayouts);
        if (currentPage >= index) setCurrentPage(Math.max(0, currentPage - 1));
    };

    const handleMoveItemToPage = (itemId: string, toPage: number) => {
        const newLayouts = JSON.parse(JSON.stringify(layouts));
        const itemIndex = newLayouts[currentPage].findIndex((item: ReportLayoutItem) => item.i === itemId);
        if (itemIndex > -1) {
            const [itemToMove] = newLayouts[currentPage].splice(itemIndex, 1);
            itemToMove.x = 0; itemToMove.y = Infinity; // Place at bottom
            newLayouts[toPage].push(itemToMove);
            onUpdateLayout(newLayouts);
        }
        setItemMenu(null);
    };

    const onDrop = (layout: ReportLayoutItem[], item: ReportLayoutItem, e: DragEvent) => {
        const data = JSON.parse(e.dataTransfer?.getData('application/json') || '{}');
        if (!data.type) return;

        let newItem: ReportLayoutItem | null = null;
        if (['chart', 'kpi'].includes(data.type)) {
            if (layouts[currentPage].some(l => l.i === data.id)) return;
            newItem = { ...item, i: data.id, w: data.type === 'chart' ? 6 : 3, h: data.type === 'chart' ? 4 : 2 };
        } else if (data.type === 'text') {
            const newBlock: TextBlock = { id: `text_${uuidv4()}`, type: 'text', title: `New ${data.style} Block`, content: 'Double-click to edit...', style: data.style };
            onUpdateProject(p => ({ ...p, reportTextBlocks: [...(p.reportTextBlocks || []), newBlock] }));
            newItem = { ...item, i: newBlock.id, w: data.style === 'title' ? 12 : 6, h: data.style === 'title' ? 1 : 2 };
        }
        
        if (newItem) onUpdateLayout(layouts.map((l, i) => i === currentPage ? [...l, newItem!] : l));
    };
    
    const onLayoutChange = (newLayout: ReportLayoutItem[]) => onUpdateLayout(layouts.map((l, i) => i === currentPage ? newLayout : l));

    const handleAiAction = async (item: ReportLayoutItem, action: 'summary' | 'insights' | 'improve' | 'summarize_text' | 'check_grammar') => {
        const loadingKey = `${item.i}_${action}`;
        setAiLoading(loadingKey); setAiMenuOpen(null);

        try {
            let aiResult: string;
            const chart = project.analysis?.charts.find(c => c.id === item.i);
            const textBlock = project.reportTextBlocks?.find(b => b.id === item.i);

            if (chart && (action === 'summary' || action === 'insights')) {
                aiResult = await generateChartInsight(chart, project.dataSource.data, action);
                const newBlock: TextBlock = { id: `text_ai_${uuidv4()}`, type: 'text', title: `AI Insight`, content: aiResult };
                onUpdateProject(p => ({ ...p, reportTextBlocks: [...(p.reportTextBlocks || []), newBlock] }));
                const newLayoutItem: ReportLayoutItem = { i: newBlock.id, x: item.x, y: item.y + item.h, w: item.w, h: 2 };
                onUpdateLayout(layouts.map((l, i) => i === currentPage ? [...l, newLayoutItem] : l));

            } else if (textBlock && ['improve', 'summarize_text', 'check_grammar'].includes(action)) {
                 aiResult = await improveText(textBlock.content, action as any);
                 onUpdateProject(p => ({ ...p, reportTextBlocks: (p.reportTextBlocks || []).map(b => b.id === textBlock.id ? {...b, content: aiResult } : b)}));
            } else { throw new Error("Invalid AI action for item type."); }

        } catch (e: any) { alert(`AI Assistant Error: ${e.message}`); } finally { setAiLoading(null); }
    };

    const renderGridItem = useCallback((item: ReportLayoutItem): React.ReactElement => {
        const chart = project.analysis?.charts.find(c => c.id === item.i);
        const kpi = project.analysis?.kpis.find(k => k.id === item.i);
        const textBlock = project.reportTextBlocks?.find(b => b.id === item.i);

        return (
            <div key={item.i} className="group relative bg-white">
                {chart && <ChartRenderer config={chart} data={filterData(project.dataSource.data, reportFilters, reportTimeFilter, null)} allData={project.dataSource.data} dateColumn={null} onFilterChange={(col, val) => setReportFilters(f => ({...f, [col]: val}))} onTimeFilterChange={setReportTimeFilter} activeFilters={reportFilters} activeTimeFilter={reportTimeFilter} />}
                {kpi && <ReportKpiCard kpi={kpi} value={kpiValues[kpi.id] ?? null} />}
                {textBlock && <EditableTextBlock block={textBlock} onUpdate={b => onUpdateProject(p => ({ ...p, reportTextBlocks: (p.reportTextBlocks || []).map(tb => tb.id === b.id ? b : tb)}))} />}
                
                <div className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity z-20" ref={aiMenuRef}>
                    {(chart || textBlock) && (<>
                        <button onClick={() => setAiMenuOpen(item.i === aiMenuOpen ? null : item.i)} className="p-1.5 rounded-full bg-primary-100/80 backdrop-blur-sm text-primary-600 hover:bg-primary-200 shadow-md"><Sparkles size={16}/></button>
                        {aiMenuOpen === item.i && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1">
                                {chart && <>
                                    <AiMenuItem icon={MessageSquare} text="Summarize Chart" action={() => handleAiAction(item, 'summary')} loadingKey={`${item.i}_summary`} aiLoading={aiLoading} />
                                    <AiMenuItem icon={ListChecks} text="Generate Insights" action={() => handleAiAction(item, 'insights')} loadingKey={`${item.i}_insights`} aiLoading={aiLoading} />
                                </>}
                                {textBlock && <>
                                    <AiMenuItem icon={Check} text="Check Grammar" action={() => handleAiAction(item, 'check_grammar')} loadingKey={`${item.i}_check_grammar`} aiLoading={aiLoading} />
                                    <AiMenuItem icon={Pencil} text="Improve Writing" action={() => handleAiAction(item, 'improve')} loadingKey={`${item.i}_improve`} aiLoading={aiLoading} />
                                    <AiMenuItem icon={MessageSquare} text="Summarize Text" action={() => handleAiAction(item, 'summarize_text')} loadingKey={`${item.i}_summarize_text`} aiLoading={aiLoading} />
                                </>}
                            </div>
                        )}
                    </>)}
                </div>
                 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" ref={menuRef}>
                    <button onClick={() => setItemMenu(item.i === itemMenu ? null : item.i)} className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-slate-100 shadow-md"><MoreVertical size={16}/></button>
                    {itemMenu === item.i && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1">
                            <div className="px-3 py-1 text-xs font-semibold text-slate-400">Move to Page</div>
                            {layouts.map((_, pageIndex) => pageIndex !== currentPage && <button key={pageIndex} onClick={() => handleMoveItemToPage(item.i, pageIndex)} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Page {pageIndex + 1}</button>)}
                        </div>
                    )}
                </div>
            </div>
        );
    }, [project, layouts, currentPage, kpiValues, reportFilters, reportTimeFilter, itemMenu, aiMenuOpen, aiLoading, onUpdateProject]);

    return (
        <div className="flex h-[calc(100vh-280px)] bg-slate-100/50 rounded-2xl border border-slate-200 relative">
            <ContentPanel project={project} isCollapsed={isSidebarCollapsed} onToggle={() => setSidebarCollapsed(s => !s)} />
            
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-shrink-0 bg-white/70 backdrop-blur-sm border-b border-slate-200 p-2 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                        {layouts.map((_, index) => (
                            <button key={index} onClick={() => setCurrentPage(index)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === index ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                                Page {index + 1}
                            </button>
                        ))}
                         <button onClick={handleAddPage} className="p-2 rounded-md text-slate-500 hover:bg-slate-200"><PlusCircle size={16}/></button>
                         {layouts.length > 1 && <button onClick={() => setPageToDelete(currentPage)} className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-100"><Trash2 size={16}/></button>}
                    </div>
                </div>

                {project.reportFormat === 'pdf' && project.reportHeader && <div className="flex-shrink-0 p-2 border-b border-dashed"><EditableTextBlock block={project.reportHeader} onUpdate={b => onUpdateProject(p => ({...p, reportHeader: b}))} pageContext={{page: currentPage + 1, total: layouts.length}}/></div>}
                
                <Canvas project={project} layouts={layouts} currentPage={currentPage} onLayoutChange={onLayoutChange} onDrop={onDrop} renderGridItem={renderGridItem} />

                {project.reportFormat === 'pdf' && project.reportFooter && <div className="flex-shrink-0 p-2 border-t border-dashed"><EditableTextBlock block={project.reportFooter} onUpdate={b => onUpdateProject(p => ({...p, reportFooter: b}))} pageContext={{page: currentPage + 1, total: layouts.length}}/></div>}
            </div>

            {pageToDelete !== null && <DeletePageConfirmationModal pageNumber={pageToDelete + 1} onConfirm={() => { handleDeletePage(pageToDelete!); setPageToDelete(null); }} onClose={() => setPageToDelete(null)} />}
        </div>
    );
};
