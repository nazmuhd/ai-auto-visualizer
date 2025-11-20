
import React from 'react';
import { Project, Presentation, PresentationTheme, ChartType } from '../../../types.ts';
import { Type as TypeIcon, BarChart3, ImageIcon, Film, Shapes, Table as TableIcon, Palette, X, Heading1, Heading2, List, ListOrdered, ListTodo, MessageSquare, AlertTriangle, Quote, Square, Circle, Triangle, ArrowRight, TrendingUp, LineChart, PieChart, ScatterChart } from 'lucide-react';

// --- HELPER ---
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

// --- COMPONENT: TOOLBOX ITEM ---
export const FlyoutItem: React.FC<{
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

// --- COMPONENT: ICON NAVIGATION RAIL ---
export const IconToolbar: React.FC<{ activePanel: string | null; setActivePanel: (panel: string | null) => void }> = ({ activePanel, setActivePanel }) => (
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

// --- COMPONENT: FLYOUT PANEL ---
export const FlyoutPanel: React.FC<{ activePanel: string | null; project: Project; presentation: Presentation; onUpdateTheme: (colors: any) => void; onClose: () => void; }> = ({ activePanel, project, presentation, onUpdateTheme, onClose }) => {
    
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
