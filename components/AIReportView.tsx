import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Project, ReportLayoutItem, KpiConfig } from '../types.ts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { ChartRenderer } from './charts/ChartRenderer.tsx';
import { Download, Loader2, FileText, BarChart3, TrendingUp, Sparkles, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ReportStudioProps {
    project: Project;
    onUpdateLayout: (page1: ReportLayoutItem[], page2: ReportLayoutItem[]) => void;
}

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

const generateDefaultLayout = (analysis: Project['analysis']): { page1: ReportLayoutItem[], page2: ReportLayoutItem[] } => {
    const page1: ReportLayoutItem[] = [];
    const page2: ReportLayoutItem[] = [];

    page1.push({ i: 'report-title', x: 0, y: 0, w: 12, h: 1 });
    page1.push({ i: 'summary', x: 0, y: 1, w: 12, h: 2 });
    
    analysis?.kpis.slice(0, 4).forEach((kpi, index) => {
        page1.push({ i: kpi.id, x: (index * 3) % 12, y: 3, w: 3, h: 1 });
    });

    analysis?.charts.slice(0, 4).forEach((chart, index) => {
        page2.push({ i: chart.id, x: (index % 2) * 6, y: Math.floor(index / 2) * 4, w: 6, h: 4 });
    });

    return { page1, page2 };
};


export const ReportStudio: React.FC<ReportStudioProps> = ({ project, onUpdateLayout }) => {
    const [layouts, setLayouts] = useState(() => project.reportLayout || generateDefaultLayout(project.analysis));
    const [isExporting, setIsExporting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!project.reportLayout && project.analysis) {
            const defaultLayout = generateDefaultLayout(project.analysis);
            setLayouts(defaultLayout);
            onUpdateLayout(defaultLayout.page1, defaultLayout.page2);
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

    const handleLayoutChange = (pageIndex: 0 | 1, newLayout: ReportLayoutItem[]) => {
        const newLayouts = { ...layouts };
        const key = pageIndex === 0 ? 'page1' : 'page2';
        // Filter out any placeholder items from react-grid-layout
        newLayouts[key] = newLayout.filter(item => allComponents.has(item.i));
        setLayouts(newLayouts);
        onUpdateLayout(newLayouts.page1, newLayouts.page2);
    };
    
    const usedComponentIds = useMemo(() => new Set([...layouts.page1.map(l => l.i), ...layouts.page2.map(l => l.i)]), [layouts]);
    
    const handleDrop = (pageIndex: 0 | 1, layout: ReportLayoutItem[], item: ReportLayoutItem, e: React.DragEvent) => {
        const componentId = e.dataTransfer.getData('text/plain');
        if (!componentId) return;

        // Use the memoized set of used IDs for a more robust check across both pages
        if (usedComponentIds.has(componentId)) return;
        
        const componentType = allComponents.get(componentId)?.type;
        let h = 2, w = 4;
        if(componentType === 'chart') { w = 6; h = 4; }
        if(componentType === 'kpi') { w = 3; h = 1; }
        if(componentType === 'summary') { w = 12; h = 2; }
        if(componentType === 'title') { w = 12; h = 1; }

        // Combine positional data from `item` with the real `i` and our calculated `w` and `h`
        const newLayoutItem: ReportLayoutItem = { ...item, i: componentId, w, h };
        const key = pageIndex === 0 ? 'page1' : 'page2';
        
        setLayouts(prev => {
            const newLayouts = {...prev};
            newLayouts[key] = [...prev[key], newLayoutItem];
            onUpdateLayout(newLayouts.page1, newLayouts.page2);
            return newLayouts;
        });
    };
    
    const handleExportPdf = async () => {
        setIsExporting(true);
        await new Promise(res => setTimeout(res, 100)); // allow state to update and render print view

        const printElement = printRef.current;
        if (!printElement) {
            setIsExporting(false);
            return;
        }

        const page1 = printElement.querySelector<HTMLElement>('#print-page-1');
        const page2 = printElement.querySelector<HTMLElement>('#print-page-2');

        if (!page1 || !page2) {
             setIsExporting(false);
             return;
        }

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const canvas1 = await html2canvas(page1, { scale: 3, useCORS: true });
            const imgData1 = canvas1.toDataURL('image/png');
            pdf.addImage(imgData1, 'PNG', 0, 0, pdfWidth, pdfHeight);

            pdf.addPage();
            const canvas2 = await html2canvas(page2, { scale: 3, useCORS: true });
            const imgData2 = canvas2.toDataURL('image/png');
            pdf.addImage(imgData2, 'PNG', 0, 0, pdfWidth, pdfHeight);

            pdf.save(`${project.name}_report.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Sorry, there was an error creating the PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };
    
    const renderGridItems = (pageLayout: ReportLayoutItem[]) => {
        return pageLayout.map(l => {
            const component = allComponents.get(l.i);
            if (!component) return null;
            return (
                <div key={l.i} className="bg-white group" data-grid={l}>
                    <ReportComponent item={component.item} type={component.type} project={project} />
                     <button 
                        onClick={() => {
                            const newLayouts = {...layouts};
                            newLayouts.page1 = layouts.page1.filter(item => item.i !== l.i);
                            newLayouts.page2 = layouts.page2.filter(item => item.i !== l.i);
                            setLayouts(newLayouts);
                            onUpdateLayout(newLayouts.page1, newLayouts.page2);
                        }}
                        className="absolute top-1 right-1 z-10 p-1 bg-white/50 backdrop-blur-sm rounded-full text-slate-500 hover:text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
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
                 <button onClick={handleExportPdf} disabled={isExporting} className="w-full mb-6 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center justify-center shadow-sm disabled:bg-primary-300">
                    <Download size={16} className="mr-2"/> Export as PDF
                </button>
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
                {[...Array(2)].map((_, pageIndex) => (
                    <div key={pageIndex} className="bg-white shadow-lg rounded-xl p-6 border border-slate-200 relative">
                        <span className="absolute top-4 right-4 text-xs font-semibold text-slate-400">Page {pageIndex + 1}</span>
                         <ResponsiveGridLayout
                            className="layout min-h-[1056px]"
                            layouts={{ lg: pageIndex === 0 ? layouts.page1 : layouts.page2 }}
                            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                            rowHeight={80}
                            onLayoutChange={(layout) => handleLayoutChange(pageIndex as 0 | 1, layout)}
                            isDroppable={true}
                            onDrop={(layout, item, e) => handleDrop(pageIndex as 0 | 1, layout, item as ReportLayoutItem, e)}
                            droppingItem={{ i: 'new-item-' + Date.now(), w: 4, h: 2}}
                            useCSSTransforms={true}
                        >
                           {renderGridItems(pageIndex === 0 ? layouts.page1 : layouts.page2)}
                        </ResponsiveGridLayout>
                    </div>
                ))}
            </main>
             {/* Hidden container for high-res PDF rendering */}
            <div ref={printRef} className="fixed left-[200vw] top-0 z-[-1] opacity-0 pointer-events-none">
                 <div id="print-page-1" style={{ width: '210mm', height: '297mm', backgroundColor: 'white' }}>
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={{ lg: layouts.page1 }}
                        // FIX: Added breakpoints and cols to satisfy react-grid-layout requirements and prevent crashes.
                        breakpoints={{ lg: 1200 }}
                        cols={{ lg: 12 }}
                        rowHeight={80}
                        width={794} // 210mm at ~96dpi
                        isDraggable={false} isResizable={false}
                    >
                       {layouts.page1.map(l => <div key={l.i} data-grid={l} className="group"><ReportComponent item={allComponents.get(l.i)?.item} type={allComponents.get(l.i)?.type || ''} project={project} /></div>)}
                    </ResponsiveGridLayout>
                </div>
                <div id="print-page-2" style={{ width: '210mm', height: '297mm', backgroundColor: 'white' }}>
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={{ lg: layouts.page2 }}
                        // FIX: Added breakpoints and cols to satisfy react-grid-layout requirements and prevent crashes.
                        breakpoints={{ lg: 1200 }}
                        cols={{ lg: 12 }}
                        rowHeight={80}
                        width={794}
                        isDraggable={false} isResizable={false}
                    >
                       {layouts.page2.map(l => <div key={l.i} data-grid={l} className="group"><ReportComponent item={allComponents.get(l.i)?.item} type={allComponents.get(l.i)?.type || ''} project={project} /></div>)}
                    </ResponsiveGridLayout>
                </div>
            </div>
        </div>
    );
};