import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FilePlus,
  ChevronLeft,
  User,
  Folder,
  MoreHorizontal,
  Edit,
  Trash2,
  LogOut,
  Settings
} from 'lucide-react';
import { SavedDashboard } from '../types';

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onNewAnalysis: () => void;
  savedDashboards: SavedDashboard[];
  activeDashboardId: string | null;
  onSelectDashboard: (id: string) => void;
  onRename: (dashboard: SavedDashboard) => void;
  onDelete: (dashboard: SavedDashboard) => void;
  userEmail: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<Props> = ({ 
    isOpen, 
    setIsOpen, 
    onNewAnalysis,
    savedDashboards,
    activeDashboardId,
    onSelectDashboard,
    onRename,
    onDelete,
    userEmail,
    onLogout
}) => {
  const [contextMenuOpen, setContextMenuOpen] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenuOpen(null);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const DashboardLink: React.FC<{ dash: SavedDashboard }> = ({ dash }) => {
    const isActive = dash.id === activeDashboardId;
    const commonClasses = `flex items-center p-2.5 rounded-lg text-sm font-medium transition-colors group relative w-full ${
      isOpen ? 'justify-between' : 'justify-center'
    }`;
    const activeClasses = 'bg-primary-100 text-primary-800';
    const inactiveClasses = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';

    return (
      <li className="relative">
        <button onClick={() => onSelectDashboard(dash.id)} className={`${commonClasses} ${isActive ? activeClasses : inactiveClasses}`}>
          <div className="flex items-center truncate">
            <Folder
              size={18}
              className={`${isOpen ? 'mr-3' : ''} flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-500'}`}
            />
            {isOpen && <span className="transition-opacity duration-200 truncate pr-2">{dash.name}</span>}
             {dash.isUnsaved && isOpen && <span className="text-amber-500 font-bold">*</span>}
          </div>
        </button>
        
        {isOpen && (
            <button 
                onClick={(e) => { e.stopPropagation(); setContextMenuOpen(contextMenuOpen === dash.id ? null : dash.id); }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${contextMenuOpen === dash.id ? 'bg-slate-200' : ''} text-slate-500 hover:bg-slate-200 hover:text-slate-800 opacity-0 group-hover:opacity-100`}
            >
                <MoreHorizontal size={16} />
            </button>
        )}

        {!isOpen && (
            <span className="absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white group-hover:block z-50">
                {dash.name}{dash.isUnsaved ? '*' : ''}
            </span>
        )}

        {contextMenuOpen === dash.id && (
            <div ref={contextMenuRef} className="absolute left-4 right-4 mt-1 bg-white rounded-md shadow-lg border border-slate-100 z-20 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                <button onClick={() => { onRename(dash); setContextMenuOpen(null); }} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"><Edit size={14} className="mr-2 text-slate-400"/> Rename</button>
                <button onClick={() => { onDelete(dash); setContextMenuOpen(null); }} className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center"><Trash2 size={14} className="mr-2"/> Delete</button>
            </div>
        )}
      </li>
    );
  };

  return (
    <aside
      className={`relative bg-white border-r border-slate-200 transition-all duration-300 ease-in-out print:hidden flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className={`flex items-center h-16 px-4 border-b border-slate-200 flex-shrink-0 ${isOpen ? 'justify-start' : 'justify-center'}`}>
        <a href="#" className="flex items-center">
            <div className="bg-primary-600 text-white p-2 rounded-lg">
                <Sparkles size={20} className="fill-primary-400 text-white" />
            </div>
            {isOpen && <h1 className="ml-3 text-lg font-bold text-slate-900 whitespace-nowrap">AI Insights</h1>}
        </a>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute -right-3 top-8 bg-white border border-slate-200 p-1 rounded-full text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-transform focus:outline-none focus:ring-2 focus:ring-primary-500 z-10 ${!isOpen && 'rotate-180'}`}
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 p-4 space-y-4">
             <div>
                <button
                    onClick={onNewAnalysis}
                    className={`flex items-center p-3 rounded-lg text-sm font-semibold transition-colors group relative w-full bg-primary-600 text-white hover:bg-primary-700 shadow-sm ${isOpen ? 'justify-start' : 'justify-center'}`}
                >
                    <FilePlus size={20} className={`${isOpen ? 'mr-3' : ''} flex-shrink-0`} />
                    {isOpen && <span className="transition-opacity duration-200">New Analysis</span>}
                    {!isOpen && <span className="absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white group-hover:block z-50">New Analysis</span>}
                </button>
            </div>
          
            <div className="space-y-1">
                {isOpen && <div className="px-1 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">My Dashboards</div>}
                <ul className="space-y-1">
                    {savedDashboards.length === 0 && isOpen && (
                        <p className="text-xs text-slate-400 px-2 py-4 text-center">Your saved dashboards will appear here.</p>
                    )}
                    {savedDashboards.map((dash) => <DashboardLink key={dash.id} dash={dash} />)}
                </ul>
            </div>
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-100" ref={profileMenuRef}>
            {isProfileMenuOpen && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-md shadow-lg border border-slate-100 z-20 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                    <button disabled className="w-full cursor-not-allowed text-left px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-100 flex items-center opacity-50"><Settings size={14} className="mr-2"/> Settings</button>
                    <button onClick={onLogout} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"><LogOut size={14} className="mr-2"/> Logout</button>
                </div>
            )}
             <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className={`flex items-center w-full p-2 rounded-lg transition-colors group text-slate-600 hover:bg-slate-100 hover:text-slate-900 ${isOpen ? '' : 'justify-center'}`}>
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-slate-500"/>
                </div>
                {isOpen && (
                    <div className="ml-3 text-left">
                        <p className="text-sm font-semibold text-slate-800 truncate">{userEmail}</p>
                        <p className="text-xs text-slate-500">Account</p>
                    </div>
                )}
                 {!isOpen && (
                    <span className="absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white group-hover:block z-50">
                        {userEmail}
                    </span>
                )}
             </button>
        </div>
      </div>
    </aside>
  );
};
