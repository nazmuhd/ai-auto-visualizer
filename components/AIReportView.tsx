import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Project, ReportLayoutItem, KpiConfig, ChartConfig, TextBlock, DataRow } from '../types.ts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ChartRenderer } from './charts/ChartRenderer.tsx';
import { Download, FileText, BarChart3, TrendingUp, Type, X, PlusCircle, Trash2, MoreVertical, ChevronsRight, Edit2, AlertTriangle, Sparkles, Loader2, MessageSquare, ListChecks, Pencil } from 'lucide-react';
import { generateChartInsight, improveText } from '../services/geminiService.ts';
import { v4 as uuidv4 } from 'uuid';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ReportStudioProps {
    project: Project;
    onUpdateLayout: (pages: ReportLayoutItem[][]) => void;
    onUpdateProject: (updater: (prev: Project) => Project) => void;
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

const EditableTextBlock: React.FC<{ block: TextBlock, onUpdate: (updatedBlock: TextBlock) => void }> = ({ block, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(block.content);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing) {
            textAreaRef.current?.focus();
            textAreaRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        onUpdate({ ...block, content });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 h-full">
                <textarea
                    ref={textAreaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onBlur={handleSave}
                    className="w-full h-full border-none outline-none resize-none text-sm"
                />
            </div>
        );
    }

    return (
        <div 
            onDoubleClick={() => setIsEditing(true)} 
            className="p-4 bg-white rounded-lg border border-slate-200 h-full prose prose-sm max-w-none prose-p:my-1"
        >
            <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') || '<p class="text-slate-400">Double-click to edit...</p>' }} />
        </div>
    );
};

const DeletePageConfirmationModal: React.FC<{ pageNumber: number, onConfirm: () => void, onClose: () => void }> = ({ pageNumber, onConfirm, onClose }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
        <div role="dialog" className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
             <div className="flex items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Delete Page {pageNumber}</h3>
                    <p className="mt-2 text-sm text-slate-500">Are you sure you want to delete this page? This action cannot be undone.</p>
                </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button onClick={onConfirm} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm">Delete</button>
                <button onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
            </div>
        </div>
    </div>
);

export const ReportStudio: React.FC<ReportStudioProps> = ({ project, onUpdateLayout, onUpdateProject }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [layouts, setLayouts] = useState<ReportLayoutItem[][]>(project.reportLayout || [[]]);
    const [pageToDelete, setPageToDelete] = useState<number | null>(null);
    const [itemMenu, setItemMenu] = useState<string | null>(null);
    const [aiMenuOpen, setAiMenuOpen] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState<string | null>(null);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const aiMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLayouts(project.reportLayout || [[]]);
    }, [project.reportLayout]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setItemMenu(null);
            if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) setAiMenuOpen(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const kpiValues = useMemo(() => {
        const values: Record<string, number | null> = {};
        project.analysis?.kpis.forEach(kpi => {
            values[kpi.id] = calculateKpiValue(project.dataSource.data, kpi);
        });
        return values;
    }, [project.analysis?.kpis, project.dataSource.data]);

    const handleAddPage = () => {
        const newLayouts = [...layouts, []];
        setLayouts(newLayouts);
        onUpdateLayout(newLayouts);
        setCurrentPage(newLayouts.length - 1);
    };

    const handleDeletePage = (index: number) => {
        const newLayouts = layouts.filter((_, i) => i !== index);
        setLayouts(newLayouts);
        onUpdateLayout(newLayouts);
        if (currentPage >= index) {
            setCurrentPage(Math.max(0, currentPage - 1));
        }
    };
    
    const handleMoveItemToPage = (itemId: string, fromPage: number, toPage: number) => {
        const newLayouts = JSON.parse(JSON.stringify(layouts));
        const fromPageLayout = newLayouts[fromPage];
        const itemIndex = fromPageLayout.findIndex((item: ReportLayoutItem) => item.i === itemId);
        if (itemIndex > -1) {
            const [itemToMove] = fromPageLayout.splice(itemIndex, 1);
            itemToMove.x = 0;
            itemToMove.y = Infinity; // Place at the bottom
            newLayouts[toPage].push(itemToMove);
            setLayouts(newLayouts);
            onUpdateLayout(newLayouts);
        }
        setItemMenu(null);
    };

    const onDrop = (layout: ReportLayoutItem[], item: ReportLayoutItem, e: DragEvent) => {
        const type = e.dataTransfer?.getData('text/plain');
        let newElementId: string | undefined;

        if (type === 'text-block') {
            const newBlock: TextBlock = {
                id: `text_${uuidv4()}`,
                type: 'text',
                title: 'New Text Block',
                content: 'This is a new text block. Double-click to edit.'
            };
            onUpdateProject(p => ({
                ...p,
                reportTextBlocks: [...(p.reportTextBlocks || []), newBlock]
            }));
            newElementId = newBlock.id;
        }

        if (newElementId) {
            const newLayouts = [...layouts];
            newLayouts[currentPage] = [...newLayouts[currentPage], { ...item, i: newElementId }];
            setLayouts(newLayouts);
            onUpdateLayout(newLayouts);
        }
    };
    
    const onLayoutChange = (newLayout: ReportLayoutItem[]) => {
        const newLayouts = [...layouts];
        newLayouts[currentPage] = newLayout;
        setLayouts(newLayouts);
        onUpdateLayout(newLayouts);
    };

    const handleTextBlockUpdate = (updatedBlock: TextBlock) => {
        onUpdateProject(p => ({
            ...p,
            reportTextBlocks: (p.reportTextBlocks || []).map(b => b.id === updatedBlock.id ? updatedBlock : b)
        }));
    };

    const handleAiAction = async (item: ReportLayoutItem, action: 'summary' | 'insights' | 'improve' | 'summarize_text') => {
        const loadingKey = `${item.i}_${action}`;
        setAiLoading(loadingKey);
        setAiMenuOpen(null);

        try {
            let aiResult: string;
            let sourceTitle: string = 'AI';
            
            const chart = project.analysis?.charts.find(c => c.id === item.i);
            const textBlock = project.reportTextBlocks?.find(b => b.id === item.i);

            if (chart && (action === 'summary' || action === 'insights')) {
                sourceTitle = chart.title;
                aiResult = await generateChartInsight(chart, project.dataSource.data, action);
            } else if (textBlock && (action === 'improve' || action === 'summarize_text')) {
                sourceTitle = textBlock.title;
                aiResult = await improveText(textBlock.content, action === 'improve' ? 'improve' : 'summarize');
            } else {
                throw new Error("Invalid AI action for item type.");
            }

            const newBlock: TextBlock = {
                id: `text_ai_${uuidv4()}`,
                type: 'text',
                title: `AI Insight for ${sourceTitle}`,
                content: aiResult,
            };

            const newLayoutItem: ReportLayoutItem = { i: newBlock.id, x: item.x, y: item.y + item.h, w: item.w, h: 2 };
            
            onUpdateProject(p => ({ ...p, reportTextBlocks: [...(p.reportTextBlocks || []), newBlock] }));
            
            const newLayouts = JSON.parse(JSON.stringify(layouts));
            newLayouts[currentPage].push(newLayoutItem);
            setLayouts(newLayouts);
            onUpdateLayout(newLayouts);

        } catch (e: any) {
            alert(`AI Assistant Error: ${e.message}`);
        } finally {
            setAiLoading(null);
        }
    };

    const renderGridItem = (item: ReportLayoutItem) => {
        const chart = project.analysis?.charts.find(c => c.id === item.i);
        if (chart) return <ChartRenderer config={chart} data={project.dataSource.data} allData={project.dataSource.data} dateColumn={null} onFilterChange={()=>{}} onTimeFilterChange={()=>{}} activeFilters={{}} activeTimeFilter={{type:'all'}} />;

        const kpi = project.analysis?.kpis.find(k => k.id === item.i);
        if (kpi) return <ReportKpiCard kpi={kpi} value={kpiValues[kpi.id] ?? null} />;
        
        const textBlock = project.reportTextBlocks?.find(b => b.id === item.i);
        if(textBlock) return <EditableTextBlock block={textBlock} onUpdate={handleTextBlockUpdate} />;

        return <div className="bg-slate-100 rounded-lg p-4">Unknown item: {item.i}</div>;
    };

    return (
        <div className="flex h-[calc(100vh-280px)] bg-slate-100/50 rounded-2xl border border-slate-200">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">Report Pages</h3>
                <div className="flex-1 space-y-2 overflow-y-auto">
                    {layouts.map((_, index) => (
                        <div key={index} className={`group relative p-2 rounded-lg border-2 transition-colors ${currentPage === index ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:bg-slate-100'}`}>
                           <button onClick={() => setCurrentPage(index)} className="w-full text-left font-medium text-slate-700">Page {index + 1}</button>
                           <button onClick={() => setPageToDelete(index)} className="absolute top-1/2 -translate-y-1/2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddPage} className="w-full flex items-center justify-center py-2 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"><PlusCircle size={16} className="mr-2"/>Add Page</button>
                 <div className="border-t border-slate-200 pt-4 mt-auto">
                     <h3 className="font-bold text-slate-800 text-lg mb-2">Add Content</h3>
                     <p className="text-xs text-slate-500 mb-2">Drag and drop elements onto your report page.</p>
                      <div className="space-y-2">
                        {[{id: 'text-block', name: 'Text Block', icon: Type}].map(item => (
                            <div key={item.id} draggable unselectable="on" onDragStart={e => e.dataTransfer.setData('text/plain', item.id)} className="flex items-center p-2 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-grab">
                                <item.icon size={16} className="mr-2 text-slate-500"/>
                                <span className="text-sm font-medium text-slate-700">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Main Canvas */}
            <div className="flex-1 overflow-auto p-4">
                <div className="bg-white shadow-inner min-h-full">
                     <ResponsiveGridLayout
                        className="layout"
                        layouts={{ lg: layouts[currentPage] || [] }}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                        rowHeight={80}
                        onDrop={onDrop}
                        onLayoutChange={onLayoutChange}
                        isDroppable={true}
                        droppingItem={{ i: 'new-item', w: 4, h: 2 }}
                    >
                        {(layouts[currentPage] || []).map(item => {
                             const isChart = project.analysis?.charts.some(c => c.id === item.i);
                             const isTextBlock = project.reportTextBlocks?.some(b => b.id === item.i);
                             const AiMenuItem = ({ icon: Icon, text, action, loadingAction }: { icon: any, text: string, action: () => void, loadingAction: string }) => (
                                <button onClick={action} disabled={!!aiLoading} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center disabled:opacity-50">
                                    {aiLoading === loadingAction ? <Loader2 size={14} className="mr-2 animate-spin"/> : <Icon size={14} className="mr-2 text-slate-400" />}
                                    {text}
                                </button>
                            );
                            return (
                            <div key={item.i} className="group relative bg-white">
                                {renderGridItem(item)}
                                <div className="absolute top-1 right-12 opacity-0 group-hover:opacity-100 transition-opacity z-10" ref={aiMenuRef}>
                                    {(isChart || isTextBlock) && (
                                        <>
                                            <button onClick={() => setAiMenuOpen(item.i === aiMenuOpen ? null : item.i)} className="p-1.5 rounded-full bg-primary-100/80 backdrop-blur-sm text-primary-600 hover:bg-primary-200 shadow-md">
                                                <Sparkles size={16}/>
                                            </button>
                                             {aiMenuOpen === item.i && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1">
                                                     {isChart && (
                                                        <>
                                                            <AiMenuItem icon={MessageSquare} text="Summarize Chart" action={() => handleAiAction(item, 'summary')} loadingAction={`${item.i}_summary`} />
                                                            <AiMenuItem icon={ListChecks} text="Generate Insights" action={() => handleAiAction(item, 'insights')} loadingAction={`${item.i}_insights`} />
                                                        </>
                                                    )}
                                                    {isTextBlock && (
                                                        <>
                                                            <AiMenuItem icon={Pencil} text="Improve Writing" action={() => handleAiAction(item, 'improve')} loadingAction={`${item.i}_improve`} />
                                                            <AiMenuItem icon={MessageSquare} text="Summarize Text" action={() => handleAiAction(item, 'summarize_text')} loadingAction={`${item.i}_summarize_text`} />
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                 <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" ref={menuRef}>
                                    <button onClick={() => setItemMenu(item.i === itemMenu ? null : item.i)} className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-slate-100 shadow-md">
                                        <MoreVertical size={16}/>
                                    </button>
                                    {itemMenu === item.i && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1">
                                            <div className="px-3 py-1 text-xs font-semibold text-slate-400">Move to Page</div>
                                            {layouts.map((_, pageIndex) => pageIndex !== currentPage && (
                                                <button key={pageIndex} onClick={() => handleMoveItemToPage(item.i, currentPage, pageIndex)} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Page {pageIndex + 1}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )})}
                    </ResponsiveGridLayout>
                </div>
            </div>

            {pageToDelete !== null && (
                <DeletePageConfirmationModal 
                    pageNumber={pageToDelete + 1}
                    onConfirm={() => { handleDeletePage(pageToDelete); setPageToDelete(null); }}
                    onClose={() => setPageToDelete(null)}
                />
            )}
        </div>
    );
};