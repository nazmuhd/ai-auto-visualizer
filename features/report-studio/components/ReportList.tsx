
import React, { useState, useEffect, useRef } from 'react';
import { Bot, PlusCircle, FileText, MoreVertical } from 'lucide-react';
import { Project, Presentation } from '../../../types.ts';
import { Button } from '../../../components/ui/index.ts';

interface Props {
    project: Project;
    onCreateReport: () => void;
    onSelectPresentation: (id: string) => void;
    onRenamePresentation: (id: string) => void;
    onDuplicatePresentation: (id: string) => void;
    onDeletePresentation: (presentation: Presentation) => void;
}

export const ReportList: React.FC<Props> = ({ 
    project, 
    onCreateReport, 
    onSelectPresentation, 
    onRenamePresentation, 
    onDuplicatePresentation, 
    onDeletePresentation 
}) => {
    const presentations = project.presentations || [];
    const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenFor(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    if (presentations.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="p-4 bg-primary-100 text-primary-600 rounded-full mb-6 inline-block">
                    <Bot size={40} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Create your report instantly</h2>
                <p className="text-lg text-slate-500 mt-2 mb-10 max-w-lg mx-auto">Let AI help you build a professional presentation from your dashboard insights.</p>
                <div className="flex justify-center">
                    <Button onClick={onCreateReport} size="lg" icon={PlusCircle}>Create a Presentation</Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Report Studio Hub</h2>
                <Button onClick={onCreateReport} icon={PlusCircle}>Create New Presentation</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {presentations.map((p: Presentation) => (
                    <div key={p.id} className="group relative">
                        <button onClick={() => onSelectPresentation(p.id)} className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-primary-500 hover:shadow-xl transition-all transform hover:-translate-y-1 bg-white h-full flex flex-col">
                            <div className="aspect-video w-full rounded-lg bg-slate-100 border border-slate-200 group-hover:bg-primary-50/50 flex items-center justify-center mb-4 transition-colors">
                                <FileText size={40} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                            </div>
                            <div className="mt-auto">
                                <h3 className="font-bold text-slate-800 truncate text-lg">{p.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">{p.slides.length} {p.format === 'slides' ? 'Slides' : 'Pages'}</p>
                            </div>
                        </button>
                        <div className="absolute top-3 right-3">
                             <button onClick={(e) => { e.stopPropagation(); setMenuOpenFor(p.id); }} className="p-2 rounded-full text-slate-500 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-slate-100 focus:opacity-100 transition-all shadow-sm border border-slate-200/50">
                                <MoreVertical size={18} />
                             </button>
                             {menuOpenFor === p.id && (
                                <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <button onClick={() => { onRenamePresentation(p.id); setMenuOpenFor(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center font-medium">Rename</button>
                                    <button onClick={() => { onDuplicatePresentation(p.id); setMenuOpenFor(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center font-medium">Duplicate</button>
                                    <div className="my-1 border-t border-slate-100"></div>
                                    <button onClick={() => { onDeletePresentation(p); setMenuOpenFor(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center font-medium">Delete</button>
                                </div>
                             )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
