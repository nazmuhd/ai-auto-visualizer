
import React from 'react';
import { Slide, Project, Presentation } from '../../../types.ts';
import { Section, Trash2 } from 'lucide-react';

interface Props {
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
}

export const SlidePreview: React.FC<Props> = ({ slide, index, isActive, project, presentation, isSlides, viewMode, onClick, onDelete, onAddSection }) => {
    
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
