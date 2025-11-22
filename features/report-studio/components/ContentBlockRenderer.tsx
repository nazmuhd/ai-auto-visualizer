
import React, { useState, useRef, useEffect } from 'react';
import { ContentBlock, PresentationTheme } from '../../../types.ts';
import { ImageIcon, PlayCircle, Shapes, CheckSquare, Info, AlertTriangle, Edit3 } from 'lucide-react';

interface Props {
    block: ContentBlock;
    theme: PresentationTheme;
    onUpdate: (updatedBlock: ContentBlock) => void;
}

export const ContentBlockRenderer: React.FC<Props> = ({ block, theme, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(block.content);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { setContent(block.content); }, [block.content]);
    
    useEffect(() => {
        if (isEditing && textAreaRef.current) {
            textAreaRef.current.focus();
            // Auto-grow logic
            const el = textAreaRef.current;
            el.style.height = '100%';
        }
    }, [isEditing]);

    const handleSave = () => {
        if (content !== block.content) {
            onUpdate({ ...block, content });
        }
        setIsEditing(false);
    };

    // --- RENDERERS BY TYPE ---

    if (block.type === 'image') {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg overflow-hidden relative group select-none">
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
            </div>
        );
    }

    if (block.type === 'video') {
         return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 rounded-lg overflow-hidden relative group select-none">
                <div className="text-center text-slate-500">
                    <PlayCircle size={64} className="mx-auto mb-2 text-white opacity-80"/>
                    <p className="text-sm font-medium text-slate-400">{block.content || "No Video Source"}</p>
                </div>
                <div className="absolute inset-0 bg-white/0 hover:bg-white/5 transition-colors cursor-pointer" onDoubleClick={(e) => {
                     e.stopPropagation();
                     const url = prompt("Enter Video URL:", block.content);
                     if (url) onUpdate({ ...block, content: url });
                 }}></div>
            </div>
        );
    }
    
    if (block.type === 'shape') {
         const fillColor = block.fill || theme.colors.accent2;
         return (
            <div className="h-full w-full flex items-center justify-center relative group select-none">
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
            <div className="h-full w-full bg-white border border-slate-300 rounded shadow-sm overflow-hidden flex flex-col group select-none">
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
            return <ul className="list-disc pl-5 space-y-1 text-slate-700 w-full break-words">{text.split('\n').filter(l => l.trim()).map((l, i) => <li key={i}>{l.replace(/^[-*] /, '')}</li>)}</ul>;
        }
        if (block.style === 'number') {
            return <ol className="list-decimal pl-5 space-y-1 text-slate-700 w-full break-words">{text.split('\n').filter(l => l.trim()).map((l, i) => <li key={i}>{l.replace(/^\d+\. /, '')}</li>)}</ol>;
        }
        if (block.style === 'todo') {
             return <div className="space-y-2 w-full break-words">{text.split('\n').filter(l => l.trim()).map((l, i) => <div key={i} className="flex items-center text-slate-700"><CheckSquare size={16} className="text-slate-300 mr-2 flex-shrink-0"/><span>{l.replace(/^\[ \] /, '')}</span></div>)}</div>;
        }
        
        const htmlContent = text.replace(/\n/g, '<br />');
        const colorStyle = { color: theme.colors.text };

        switch (block.style) {
            case 'title': return <h1 className="text-4xl font-bold leading-tight break-words w-full" style={{ color: theme.colors.accent1 }} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
            case 'h1': return <h1 className="text-3xl font-bold leading-snug break-words w-full" style={colorStyle} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
            case 'h2': return <h2 className="text-2xl font-semibold leading-snug break-words w-full" style={{ color: theme.colors.accent2 }} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
            case 'quote': return <blockquote className="border-l-4 pl-4 italic text-lg break-words w-full" style={{ borderColor: theme.colors.accent1, color: theme.colors.text }} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
            case 'note': return <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-900 flex items-start h-full w-full overflow-hidden"><Info className="w-5 h-5 mr-2 flex-shrink-0 text-blue-600 mt-0.5"/><div className="flex-1 min-w-0"><p className="font-bold text-sm mb-1">Note</p><div className="text-sm opacity-90 break-words" dangerouslySetInnerHTML={{ __html: htmlContent }} /></div></div>;
            case 'warning': return <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-900 flex items-start h-full w-full overflow-hidden"><AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 text-amber-600 mt-0.5"/><div className="flex-1 min-w-0"><p className="font-bold text-sm mb-1">Warning</p><div className="text-sm opacity-90 break-words" dangerouslySetInnerHTML={{ __html: htmlContent }} /></div></div>;
            default: return <div className="text-slate-700 leading-relaxed break-words whitespace-pre-wrap w-full h-full" style={colorStyle} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
        }
    };

    if (isEditing) {
        return (
             <div className="bg-white rounded-lg border-2 border-primary-400 shadow-sm w-full h-full overflow-hidden flex flex-col z-50 relative nodrag" onMouseDown={e => e.stopPropagation()}>
                <div className="bg-slate-50 px-2 py-1 border-b border-slate-100 text-xs text-slate-500 uppercase font-bold tracking-wider flex justify-between items-center flex-shrink-0">
                    <span>Editing {block.style}</span>
                    <button onMouseDown={handleSave} className="text-primary-600 hover:text-primary-700 px-2 py-0.5 rounded hover:bg-primary-50">Done</button>
                </div>
                <textarea
                    ref={textAreaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onBlur={handleSave}
                    placeholder="Type here..."
                    className="w-full flex-1 p-4 border-0 outline-none resize-none text-slate-800 bg-white text-sm"
                />
            </div>
        );
    }
    
    const isPlaceholder = !content && !isEditing;
    return (
        <div 
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
            className="h-full w-full cursor-text group relative select-none overflow-hidden"
        >
            <div className={`h-full w-full ${!isPlaceholder ? '' : 'flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50'}`}>
                {isPlaceholder ? <span className="text-slate-400 italic text-sm pointer-events-none">Double-click to add content</span> : renderTextContent()}
            </div>
        </div>
    );
};
