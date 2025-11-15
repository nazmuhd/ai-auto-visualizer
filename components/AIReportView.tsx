import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Project, ReportLayoutItem, KpiConfig } from '../types.ts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ChartRenderer } from './charts/ChartRenderer.tsx';
import { Download, Loader2, FileText, BarChart3, TrendingUp, Sparkles, X, PlusCircle, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ReportStudioProps {
    project: Project;
    onUpdateLayout: (pages: ReportLayoutItem[][]) => void;
}

type UserTier = 'free' | 'pro' | 'enterprise';

const TIER_CONFIG: Record<UserTier, { name: string; maxPages: number }> = {
    free: { name: 'Free', maxPages: 3 },
    pro: { name: 'Pro', maxPages: 5 },
    enterprise: { name: 'Enterprise', maxPages: 7 },
};


const ReportKpiCard: React.FC<{ kpi: KpiConfig, value: number | null }> = ({ kpi, value }) => {
    const formattedValue = new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(value ?? 0);
    return (
        <div className="p-4 bg-white rounded-lg border border-slate-200 h-full flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500 mb-1 truncate">{kpi.title}</p>
            <p className="text-3xl font-bold text-slate-900">{formattedValue}</p>
        </div>
    );
};

const ReportComponent: React.FC<{ item: any, type: string, project: Project }> = ({ item, type, project }) => {
    if (!item) return <div className="p-4 bg-red-100 text-red-700">Component data not found.</div>;

    switch(type) {
        case 'chart':
            return <ChartRenderer config={item} data={project.dataSource.data} allData={project.dataSource.data} onUpdate={() => {}} dateColumn={null} activeFilters={{}} activeTimeFilter={{type:'all'}} onFilterChange={() => {}} onTimeFilterChange={()=>{}} />;
        case 'kpi':
            const value = useMemo(() => {
                const data = project.dataSource.data;
                if (!data || data.length === 0) return null;
                if(item.operation === 'sum') return data.reduce((acc, row) => acc + (Number(row[item.column]) || 0), 0);
                if(item.operation === 'average') return data.reduce((acc, row) => acc + (Number(row[item.column]) || 0), 0) / (data.length || 1);
                if(item.operation === 'count_distinct') return new Set(data.map(row => row[item.column])).size;
                return 0;
            }, [project.dataSource.data, item]);
            return <ReportKpiCard kpi={item} value={value} />;
        case 'title':
            return <div className="p-4 h-full flex items-center"><h1 className="text-4xl font-bold text-slate-900">{project.name} Report</h1></div>;
        case 'summary':
            return <div className="p-4 bg-white rounded-lg border border-slate-200 h-full overflow-y-auto"><h3 className="text-lg font-semibold text-slate-800 mb-2">Executive Summary</h3><ul className="space-y-2">{item.map((pt: string, i: number) => <li key={i} className="text-sm text-slate-600 flex items-start"><span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 mr-3 shrink-0" />{pt}</li>)}</ul></div>;
        default:
            return <div className="p-4 bg-slate-100">{item.id}</div>
    }
}

const generateDefaultLayout = (analysis: Project['analysis']): ReportLayoutItem[][] => {
    const pages: ReportLayoutItem[][] = [[], [], []]; // Default to 3 pages

    pages[0].push({ i: 'report-title', x: 0, y: 0, w: 12, h: 1 });
    pages[0].push({ i: 'summary', x: 0, y: 1, w: 12, h: 2 });
    
    analysis?.kpis.slice(0, 4).forEach((kpi, index) => {
        pages[0].push({ i: kpi.id, x: (index * 3) % 12, y: 3, w: 3, h: 1 });
    });

    analysis?.charts.slice(0, 4).forEach((chart, index) => {
        pages[1].push({ i: chart.id, x: (index % 2) * 6, y: Math.floor(index / 2) * 4, w: 6, h: 4 });
    });

    return pages;
};


export const ReportStudio: React.FC<ReportStudioProps> = ({ project, onUpdateLayout }) => {
    const [layouts, setLayouts] = useState<ReportLayoutItem[][]>(() => project.reportLayout || generateDefaultLayout(project.analysis));
    const [isExporting, setIsExporting] = useState(false);
    const [userTier, setUserTier] = useState<UserTier>('free');
    const printRef = useRef<HTMLDivElement>(null);

    const maxPages = TIER_CONFIG[userTier].maxPages;

    useEffect(() => {
        // Trim pages if current tier allows fewer pages than what's in state
        if (layouts.length > maxPages) {
            const newLayouts = layouts.slice(0, maxPages);
            setLayouts(newLayouts);
            onUpdateLayout(newLayouts);
        }
    }, [userTier, layouts, maxPages, onUpdateLayout]);

    useEffect(() => {
        if (!project.reportLayout && project.analysis) {
            const defaultLayout = generateDefaultLayout(project.analysis);
            setLayouts(defaultLayout);
            onUpdateLayout(defaultLayout);
        }
    }, [project.analysis, project.reportLayout, onUpdateLayout]);

    const allComponents = useMemo(() => {
        const items = new Map<string, { item: any, type: string }>();
        if (!project.analysis) return items;

        project.analysis.charts.forEach(c => items.set(c.id, { item: c, type: 'chart' }));
        project.analysis.kpis.forEach(k => items.set(k.id, { item: k, type: 'kpi' }));
        items.set('summary', { item: project.analysis.summary, type: 'summary' });
        items.set('report-title', { item: { id: 'report-title' }, type: 'title' });
        
        return items;
    }, [project.analysis]);

    const handleLayoutChange = (pageIndex: number, newLayout: ReportLayoutItem[]) => {
        const newLayouts = [...layouts];
        newLayouts[pageIndex] = newLayout.filter(item => allComponents.has(item.i));
        setLayouts(newLayouts);
        onUpdateLayout(newLayouts);
    };
    
    const usedComponentIds = useMemo(() => new Set(layouts.flat().map(l => l.i)), [layouts]);
    
    const handleDrop = (pageIndex: number, layout: ReportLayoutItem[], item: ReportLayoutItem, e: React.DragEvent) => {
        const componentId = e.dataTransfer.getData('text/plain');
        if (!componentId || usedComponentIds.has(componentId)) return;
        
        const componentType = allComponents.get(componentId)?.type;
        let h = 2, w = 4;
        if(componentType === 'chart') { w = 6; h = 4; }
        if(componentType === 'kpi') { w = 3; h = 1; }
        if(componentType === 'summary') { w = 12; h = 2; }
        if(componentType === 'title') { w = 12; h = 1; }

        const newLayoutItem: ReportLayoutItem = { ...item, i: componentId, w, h };
        
        setLayouts(prev => {
            const newLayouts = [...prev];
            newLayouts[pageIndex] = [...newLayouts[pageIndex], newLayoutItem];
            onUpdateLayout(newLayouts);
            return newLayouts;
        });
    };

    const addPage = () => {
        if (layouts.length < maxPages) {
            const newLayouts = [...layouts, []];
            setLayouts(newLayouts);
            onUpdateLayout(newLayouts);
        }
    };
    
    const removePage = (pageIndex: number) => {
        if (layouts.length > 1) {
            const newLayouts = layouts.filter((_, i) => i !== pageIndex);
            setLayouts(newLayouts);
            onUpdateLayout(newLayouts);
        }
    };
    
    const handleExportPdf = async () => {
        setIsExporting(true);
        await new Promise(res => setTimeout(res, 100));

        const printElement = printRef.current;
        if (!printElement) {
            setIsExporting(false);
            return;
        }

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < layouts.length; i++) {
                const pageElement = printElement.querySelector<HTMLElement>(`#print-page-${i}`);
                if (pageElement) {
                    const canvas = await html2canvas(pageElement, { scale: 3, useCORS: true });
                    const imgData = canvas.toDataURL('image/png');
                    if (i > 0) pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                }
            }
            pdf.save(`${project.name}_report.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Sorry, there was an error creating the PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };
    
    const renderGridItems = (pageLayout: ReportLayoutItem[], pageIndex: number) => {
        return pageLayout.map(l => {
            const component = allComponents.get(l.i);
            if (!component) return null;
            return (
                <div key={l.i} className="bg-white group" data-grid={l}>
                    <ReportComponent item={component.item} type={component.type} project={project} />
                     <button 
                        onClick={() => {
                            const newLayouts = [...layouts];
                            newLayouts[pageIndex] = newLayouts[pageIndex].filter(item => item.i !== l.i);
                            setLayouts(newLayouts);
                            onUpdateLayout(newLayouts);
                        }}
                        className="absolute top-1 right-1 z-10 p-1 bg-white/50 backdrop-blur-sm rounded-full text-slate-500 hover:text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from page"
                    >
                        <X size={14} />
                    </button>
                </div>
            );
        }).filter(Boolean);
    }
    
    const DraggableComponent: React.FC<{id: string, name: string, icon: React.ElementType, isUsed: boolean}> = ({ id, name, icon: Icon, isUsed }) => (
        <div 
             className={`droppable-element flex items-center p-2.5 rounded-lg border transition-all ${isUsed ? 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed opacity-60' : 'bg-white border-slate-200 hover:border-primary-400 hover:bg-primary-50'}`}
             unselectable="on"
             draggable={!isUsed}
             onDragStart={e => { if(!isUsed) e.dataTransfer.setData('text/plain', id); }}
        >
           <Icon size={16} className="mr-3 text-slate-400 flex-shrink-0" /> <span className="text-sm font-medium text-slate-700 truncate">{name}</span>
        </div>
    );
    
    const TierButton: React.FC<{tier: UserTier, label: string}> = ({ tier, label }) => (
        <button
            onClick={() => setUserTier(tier)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${userTier === tier ? 'bg-primary-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-200'}`}
        >
            {label} ({TIER_CONFIG[tier].maxPages} pages)
        </button>
    );


    if (!project.analysis) return <div>No analysis data available.</div>;

    return (
        <div className="flex gap-6 relative">
             {isExporting && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[10000] flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 text-primary-500 animate-spin mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700">Generating Your Beautiful PDF...</h3>
                    <p className="text-slate-500 mt-1">This might take a few moments.</p>
                </div>
            )}
            <aside className="w-64 bg-slate-100 p-4 rounded-2xl border border-slate-200 flex-shrink-0 h-[calc(100vh-200px)] overflow-y-auto">
                 <button onClick={handleExportPdf} disabled={isExporting} className="w-full mb-4 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center justify-center shadow-sm disabled:bg-primary-300">
                    <Download size={16} className="mr-2"/> Export as PDF
                </button>
                <div className="p-2 border border-slate-200 rounded-lg bg-white mb-4">
                     <label className="text-xs font-bold text-slate-500 mb-1.5 block">User Tier</label>
                     <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-lg">
                         <TierButton tier="free" label="Free"/>
                         <TierButton tier="pro" label="Pro"/>
                         <TierButton tier="enterprise" label="Ent."/>
                     </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-slate-500 text-sm mb-2 px-1 flex items-center"><FileText size={14} className="mr-2"/>Text Blocks</h4>
                        <div className="space-y-2">
                             <DraggableComponent id="report-title" name="Report Title" icon={Sparkles} isUsed={usedComponentIds.has('report-title')} />
                             <DraggableComponent id="summary" name="Executive Summary" icon={Sparkles} isUsed={usedComponentIds.has('summary')} />
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-slate-500 text-sm mb-2 px-1 flex items-center"><TrendingUp size={14} className="mr-2"/>KPIs</h4>
                        <div className="space-y-2">
                            {project.analysis.kpis.map(kpi => <DraggableComponent key={kpi.id} id={kpi.id} name={kpi.title} icon={TrendingUp} isUsed={usedComponentIds.has(kpi.id)} />)}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-slate-500 text-sm mb-2 px-1 flex items-center"><BarChart3 size={14} className="mr-2"/>Charts</h4>
                        <div className="space-y-2">
                            {project.analysis.charts.map(chart => <DraggableComponent key={chart.id} id={chart.id} name={chart.title} icon={BarChart3} isUsed={usedComponentIds.has(chart.id)} />)}
                        </div>
                    </div>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto h-[calc(100vh-200px)] space-y-8">
                {layouts.map((pageLayout, pageIndex) => (
                    <div key={pageIndex} className="bg-white shadow-lg rounded-xl p-6 border border-slate-200 relative group/page">
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">Page {pageIndex + 1}</span>
                            {layouts.length > 1 && (
                                <button onClick={() => removePage(pageIndex)} className="p-1.5 rounded-full bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors">
                                    <Trash2 size={14}/>
                                </button>
                            )}
                        </div>
                         <ResponsiveGridLayout
                            className="layout min-h-[1056px]"
                            layouts={{ lg: pageLayout }}
                            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                            rowHeight={80}
                            onLayoutChange={(layout) => handleLayoutChange(pageIndex, layout)}
                            isDroppable={true}
                            onDrop={(layout, item, e) => handleDrop(pageIndex, layout, item as ReportLayoutItem, e)}
                            droppingItem={{ i: 'new-item-' + Date.now(), w: 4, h: 2}}
                            useCSSTransforms={true}
                        >
                           {renderGridItems(pageLayout, pageIndex)}
                        </ResponsiveGridLayout>
                    </div>
                ))}
                {layouts.length < maxPages && (
                    <button onClick={addPage} className="w-full border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 text-slate-500 hover:border-primary-500 hover:text-primary-600 transition-colors">
                        <PlusCircle size={32} />
                        <span className="mt-2 font-semibold">Add New Page</span>
                    </button>
                )}
            </main>
             {/* Hidden container for high-res PDF rendering */}
            <div ref={printRef} className="fixed left-[200vw] top-0 z-[-1] opacity-0 pointer-events-none">
                 {layouts.map((pageLayout, pageIndex) => (
                    <div key={pageIndex} id={`print-page-${pageIndex}`} style={{ width: '210mm', height: '297mm', backgroundColor: 'white' }}>
                        <ResponsiveGridLayout
                            className="layout"
                            layouts={{ lg: pageLayout }}
                            breakpoints={{ lg: 1200 }}
                            cols={{ lg: 12 }}
                            rowHeight={80}
                            width={794} // 210mm at ~96dpi
                            isDraggable={false} isResizable={false}
                        >
                        {pageLayout.map(l => <div key={l.i} data-grid={l} className="group"><ReportComponent item={allComponents.get(l.i)?.item} type={allComponents.get(l.i)?.type || ''} project={project} /></div>)}
                        </ResponsiveGridLayout>
                    </div>
                 ))}
            </div>
        </div>
    );
};