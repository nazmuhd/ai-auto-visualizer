
import React, { useMemo } from 'react';
import { Slide, Project, Presentation, ContentBlock } from '../../../types.ts';
import { Section, Trash2, Image as ImageIcon, PlayCircle, GripVertical } from 'lucide-react';

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
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    isDragging?: boolean;
}

// Improved Mini block renderer for "wireframe" look (Bug 7 Fix)
const MiniBlock: React.FC<{ block?: ContentBlock; type?: 'chart' | 'kpi'; item: any }> = ({ block, type, item }) => {
    if (type === 'chart') {
        return (
            <div className="w-full h-full bg-white border border-sky-200 rounded-[2px] flex flex-col p-[2px] relative overflow-hidden">
                <div className="h-[2px] w-1/2 bg-sky-700 mb-[2px] rounded-full opacity-50"></div>
                <div className="flex-1 flex items-end justify-around gap-[1px] border-l border-b border-sky-100">
                    <div className="w-[20%] h-[40%] bg-sky-300/60 rounded-t-[1px]"></div>
                    <div className="w-[20%] h-[70%] bg-sky-400/60 rounded-t-[1px]"></div>
                    <div className="w-[20%] h-[50%] bg-sky-300/60 rounded-t-[1px]"></div>
                    <div className="w-[20%] h-[80%] bg-sky-400/60 rounded-t-[1px]"></div>
                </div>
            </div>
        );
    }
    if (type === 'kpi') {
        return (
            <div className="w-full h-full bg-white border border-emerald-200 rounded-[2px] flex flex-col items-center justify-center overflow-hidden">
                <div className="h-[2px] w-3/4 bg-slate-300 rounded-full opacity-50 mb-[2px]"></div>
                <div className="h-[4px] w-1/2 bg-emerald-500 rounded-full"></div>
            </div>
        );
    }

    if (!block) return <div className="w-full h-full bg-slate-50 rounded-[1px] border border-dashed border-slate-200"></div>;

    switch (block.type) {
        case 'text':
            const isTitle = block.style === 'title';
            const isHeader = block.style === 'h1' || block.style === 'h2';
            return (
                <div className="w-full h-full overflow-hidden p-[3px] flex flex-col gap-[2px]">
                    {isTitle ? (
                        <div className="w-3/4 h-[3px] bg-slate-800 rounded-sm"></div>
                    ) : isHeader ? (
                        <div className="w-1/2 h-[2px] bg-slate-600 rounded-sm mb-[1px]"></div>
                    ) : (
                        <>
                            <div className="w-full h-[1px] bg-slate-300 rounded-sm"></div>
                            <div className="w-full h-[1px] bg-slate-300 rounded-sm"></div>
                            <div className="w-2/3 h-[1px] bg-slate-300 rounded-sm"></div>
                        </>
                    )}
                </div>
            );
        case 'image':
            return (
                <div className="w-full h-full bg-slate-100 overflow-hidden flex items-center justify-center rounded-[1px] relative border border-slate-200">
                    <ImageIcon size={8} className="text-slate-300 opacity-50"/>
                </div>
            );
        case 'video':
            return (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center rounded-[1px] border border-slate-600">
                    <PlayCircle size={8} className="text-white/50"/>
                </div>
            );
        case 'shape':
            return (
                <div className="w-full h-full flex items-center justify-center p-[1px]">
                     <div className="w-2/3 h-2/3 bg-orange-300/50 rounded-full border border-orange-400/50"></div>
                </div>
            );
        case 'table':
            return (
                <div className="w-full h-full bg-white border border-slate-200 flex flex-col">
                    <div className="h-[20%] bg-slate-100 border-b border-slate-200"></div>
                    <div className="flex-1 grid grid-cols-3 gap-[1px] bg-slate-100">
                        {[...Array(6)].map((_, i) => <div key={i} className="bg-white"></div>)}
                    </div>
                </div>
            );
        default:
            return <div className="w-full h-full bg-slate-100 border border-slate-200"></div>;
    }
};

export const SlidePreview: React.FC<Props> = ({ 
    slide, index, isActive, project, presentation, isSlides, viewMode, 
    onClick, onDelete, onAddSection,
    draggable, onDragStart, onDrop, onDragOver, isDragging
}) => {
    
    // Smart Title Inference
    const titleText = useMemo(() => {
        if (slide.sectionTitle) return slide.sectionTitle;
        
        // Priority 1: Title Block
        const titleBlockId = slide.layout.find(item => {
            const b = (presentation.blocks || []).find(blk => blk.id === item.i);
            return b && b.type === 'text' && b.style === 'title';
        })?.i;
        if (titleBlockId) {
            const content = presentation.blocks?.find(b => b.id === titleBlockId)?.content;
            if (content && !content.includes('Click to add')) return content.substring(0, 25);
        }

        // Priority 2: Heading 1 Block
        const h1BlockId = slide.layout.find(item => {
            const b = (presentation.blocks || []).find(blk => blk.id === item.i);
            return b && b.type === 'text' && b.style === 'h1';
        })?.i;
        if (h1BlockId) {
            const content = presentation.blocks?.find(b => b.id === h1BlockId)?.content;
            if (content && !content.includes('Click to add')) return content.substring(0, 25);
        }

        // Priority 3: Chart Title
        const chartId = slide.layout.find(item => item.i.startsWith('chart_'))?.i;
        if (chartId) {
            const chart = project.analysis?.charts?.find(c => c.id === chartId);
            if (chart) return chart.title.substring(0, 25);
        }

        return `Slide ${index + 1}`;
    }, [slide, presentation.blocks, project.analysis]);

    const GridContent = () => (
        <div className="relative w-full h-full bg-white overflow-hidden select-none pointer-events-none">
            {slide.layout.map(item => {
                const left = (item.x / 12) * 100 + '%';
                const top = (item.y / 12) * 100 + '%';
                const width = (item.w / 12) * 100 + '%';
                const height = (item.h / 12) * 100 + '%';
                
                let block = (presentation.blocks || []).find(b => b.id === item.i);
                let type: 'chart' | 'kpi' | undefined;
                
                if (item.i.startsWith('chart_')) type = 'chart';
                else if (project.analysis?.kpis?.some(k => k.id === item.i)) type = 'kpi';

                return (
                    <div 
                        key={item.i} 
                        style={{ position: 'absolute', left, top, width, height, padding: '1px' }}
                    >
                        <MiniBlock block={block} type={type} item={item} />
                    </div>
                );
            })}
        </div>
    );

    return (
        <div
            draggable={draggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`transition-all duration-200 ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}`}
        >
            {slide.sectionTitle && viewMode === 'list' && (
                <div className="px-1 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center border-t border-slate-100 mt-2 select-none">
                    <Section size={12} className="mr-1"/> {slide.sectionTitle}
                </div>
            )}
            {viewMode === 'list' ? (
                 <div 
                    onClick={onClick}
                    className={`group cursor-pointer flex items-center p-2 rounded-lg mb-1 transition-colors relative ${isActive ? 'bg-primary-50 text-primary-900 border border-primary-200' : 'hover:bg-slate-100 text-slate-700 border border-transparent'}`}
                >
                    <div className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing" onMouseDown={e => e.stopPropagation()}>
                        <GripVertical size={12} className="text-slate-400" />
                    </div>
                    <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold mr-2 ml-2 ${isActive ? 'bg-primary-200 text-primary-800' : 'bg-slate-200 text-slate-600'}`}>
                        {index + 1}
                    </span>
                    <div className="h-8 w-12 bg-white border border-slate-200 rounded-sm mr-3 flex-shrink-0 overflow-hidden shadow-sm">
                        <GridContent />
                    </div>
                    <span className="text-sm font-medium truncate flex-1 select-none">{titleText}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center">
                         <button onClick={(e) => { e.stopPropagation(); onAddSection(e); }} title="Start Section Here" className="text-slate-400 hover:text-primary-500 p-1 rounded hover:bg-slate-200"><Section size={12}/></button>
                         {presentation.slides.length > 1 && <button onClick={(e) => { e.stopPropagation(); onDelete(e); }} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 ml-1"><Trash2 size={12} /></button>}
                    </div>
                </div>
            ) : (
                <div 
                    onClick={onClick}
                    className={`relative group cursor-pointer transition-all duration-200 rounded-lg p-2 ${isActive ? 'bg-primary-50 ring-2 ring-primary-200' : 'hover:bg-slate-100'}`}
                >
                     <div className="flex items-center justify-between mb-1.5 px-1">
                         <div className="flex items-center">
                             <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 mr-1" onMouseDown={e => e.stopPropagation()}><GripVertical size={12} className="text-slate-300" /></div>
                             <span className={`text-xs font-bold w-5 truncate ${isActive ? 'text-primary-700' : 'text-slate-400'}`}>{index + 1}</span>
                         </div>
                         <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                             <button onClick={(e) => { e.stopPropagation(); onAddSection(e); }} title="Start Section Here" className="text-slate-400 hover:text-primary-500 p-1 rounded hover:bg-slate-200 transition-opacity"><Section size={12}/></button>
                             {presentation.slides.length > 1 && <button onClick={(e) => { e.stopPropagation(); onDelete(e); }} className="text-slate-400 hover:text-red-500 transition-opacity p-1 rounded hover:bg-red-50"><Trash2 size={12} /></button>}
                         </div>
                     </div>
                     <div className={`relative w-full rounded bg-white border ${isActive ? 'border-primary-300 shadow-sm' : 'border-slate-200 shadow-sm'} overflow-hidden aspect-video pointer-events-none`}>
                        <GridContent />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 truncate px-1 font-medium">{titleText}</p>
                </div>
            )}
        </div>
    );
};
