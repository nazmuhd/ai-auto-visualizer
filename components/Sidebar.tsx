import React, { useState, useRef, useEffect, memo } from 'react';
import {
  Sparkles,
  FilePlus,
  ChevronLeft,
  User,
  Folder,
  Edit,
  Trash2,
  X,
  MoreVertical,
} from 'lucide-react';
import { Project } from '../types.ts';

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onNewProject: () => void;
  savedProjects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
  userEmail: string;
}

const ProjectLink: React.FC<{
  proj: Project;
  isActive: boolean;
  isOpen: boolean;
  isDesktop: boolean;
  contextMenuOpen: string | null;
  setContextMenuOpen: React.Dispatch<React.SetStateAction<string | null>>;
  onSelectProject: (id: string) => void;
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
}> = memo(({ proj, isActive, isOpen, isDesktop, contextMenuOpen, setContextMenuOpen, onSelectProject, onRename, onDelete }) => {
  
  const projectLinkRef = useRef<HTMLLIElement>(null);
  const isMenuOpenForThis = contextMenuOpen === proj.id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpenForThis && projectLinkRef.current && !projectLinkRef.current.contains(event.target as Node)) {
        setContextMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpenForThis, setContextMenuOpen]);

  const showThreeDots = isOpen;

  const handleCombinedClick = () => {
    onSelectProject(proj.id);
  };
  
  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenuOpen(contextMenuOpen === proj.id ? null : proj.id);
  };

  return (
    <li className="relative" ref={projectLinkRef}>
      <div className={`project-link relative flex items-center rounded-lg text-sm font-medium transition-colors w-full group/item 
        ${isActive 
            ? `bg-primary-100 text-primary-800 is-active ${!isOpen ? 'border border-primary-200' : ''}` 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
      }>
        <button
          onClick={showThreeDots ? () => onSelectProject(proj.id) : handleCombinedClick}
          className={`flex-1 p-2.5 truncate text-left ${isOpen ? '' : 'flex justify-center'}`}
        >
          <div className="flex items-center">
            <Folder
              size={18}
              className={`${isOpen ? 'mr-3' : ''} flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover/item:text-slate-500'}`}
            />
            {isOpen && (
              <span className="transition-opacity duration-200 truncate pr-2">
                {proj.name}
              </span>
            )}
          </div>
        </button>
        
        {showThreeDots && (
          <button
            onClick={handleMenuButtonClick}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity mr-2"
            aria-label={`Options for ${proj.name}`}
          >
            <MoreVertical size={16} />
          </button>
        )}
      </div>
      
      {!isOpen && (
        <span className="absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white group-hover/item:block z-50">
          {proj.name}
        </span>
      )}

      {isMenuOpenForThis && isOpen && (
        <div className={`absolute z-20 py-1.5 bg-white rounded-md shadow-lg border border-slate-100 duration-100 right-4 mt-1 w-48`}>
          <button onClick={() => { onRename(proj); setContextMenuOpen(null); }} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"><Edit size={14} className="mr-2 text-slate-400"/> Rename</button>
          <button onClick={() => { onDelete(proj); setContextMenuOpen(null); }} className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center"><Trash2 size={14} className="mr-2"/> Delete</button>
        </div>
      )}
    </li>
  );
});

export const Sidebar: React.FC<Props> = ({ 
    isOpen, 
    setIsOpen, 
    onNewProject,
    savedProjects,
    activeProjectId,
    onSelectProject,
    onRename,
    onDelete,
    userEmail
}) => {
  const [contextMenuOpen, setContextMenuOpen] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return (
    <>
        {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300" />}

        <aside
          className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out print:hidden flex flex-col z-40
            transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
            ${isOpen ? 'w-64' : 'w-20'}
          `}
        >
          <div className={`flex items-center h-16 px-4 border-b border-slate-200 flex-shrink-0 ${isOpen ? 'justify-between' : 'justify-center'}`}>
            <button onClick={onNewProject} className="flex items-center group/logo">
                <div className="bg-primary-600 text-white p-2 rounded-lg group-hover/logo:scale-105 transition-transform">
                    <Sparkles size={20} className="fill-primary-400 text-white" />
                </div>
                {isOpen && <h1 className="ml-3 text-lg font-bold text-slate-900 whitespace-nowrap">AI Insights</h1>}
            </button>
             <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-500 hover:text-slate-800">
                <X size={20} />
            </button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`absolute -right-3 top-8 bg-white border border-slate-200 p-1 rounded-full text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-transform focus:outline-none focus:ring-2 focus:ring-primary-500 z-10 ${!isOpen && 'rotate-180'} hidden md:block`}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex-1 flex flex-col min-h-0">
            <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div>
                    <button
                        onClick={onNewProject}
                        className={`flex items-center p-3 rounded-lg text-sm font-semibold transition-colors group relative w-full bg-primary-600 text-white hover:bg-primary-700 shadow-sm ${isOpen ? 'justify-start' : 'justify-center'}`}
                    >
                        <FilePlus size={20} className={`${isOpen ? 'mr-3' : ''} flex-shrink-0`} />
                        {isOpen && <span className="transition-opacity duration-200">New Project</span>}
                        {!isOpen && <span className="absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white group-hover:block z-50">New Project</span>}
                    </button>
                </div>
              
                <div className="space-y-1">
                    {isOpen && <div className="px-1 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">My Projects</div>}
                    <ul className="space-y-1">
                        {savedProjects.length === 0 && isOpen && (
                            <p className="text-xs text-slate-400 px-2 py-4 text-center">Your saved projects will appear here.</p>
                        )}
                        {savedProjects.map((proj) => (
                           <ProjectLink 
                            key={proj.id} 
                            proj={proj} 
                            isActive={proj.id === activeProjectId}
                            isOpen={isOpen}
                            isDesktop={isDesktop}
                            contextMenuOpen={contextMenuOpen}
                            setContextMenuOpen={setContextMenuOpen}
                            onSelectProject={onSelectProject}
                            onRename={onRename}
                            onDelete={onDelete}
                           />
                        ))}
                    </ul>
                </div>
            </nav>
            
            <div className="p-4 border-t border-slate-100 relative flex-shrink-0">
                <div className={`flex items-center w-full p-2 rounded-lg transition-colors group ${isOpen ? '' : 'justify-center'}`}>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-slate-500"/>
                    </div>
                    {isOpen && (
                        <div className="ml-3 text-left overflow-hidden">
                            <p className={`text-sm font-semibold truncate text-slate-800`}>{userEmail}</p>
                        </div>
                    )}
                    {!isOpen && (
                        <span className="absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white group-hover:block z-50">
                            {userEmail}
                        </span>
                    )}
                </div>
            </div>
          </div>
        </aside>
    </>
  );
};