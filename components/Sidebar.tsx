import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FilePlus,
  ChevronLeft,
  User,
  Folder,
} from 'lucide-react';
import { SavedDashboard } from '../types';

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onNewAnalysis: () => void;
  savedDashboards: SavedDashboard[];
  activeDashboardId: string | null;
  onSelectDashboard: (id: string) => void;
  userEmail: string;
}

export const Sidebar: React.FC<Props> = ({ 
    isOpen, 
    setIsOpen, 
    onNewAnalysis,
    savedDashboards,
    activeDashboardId,
    onSelectDashboard,
    userEmail
}) => {
  const NavLink: React.FC<{ item: any; isDashboardLink?: boolean }> = ({ item, isDashboardLink = false }) => {
    const isActive = isDashboardLink && item.id === activeDashboardId;
    const commonClasses = `flex items-center p-2.5 rounded-lg text-sm font-medium transition-colors group relative w-full ${
      isOpen ? 'justify-start' : 'justify-center'
    }`;
    const activeClasses = 'bg-primary-100 text-primary-800';
    const inactiveClasses = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
    const finalClasses = `${commonClasses} ${isActive ? activeClasses : inactiveClasses}`;

    return (
      <li>
        <button onClick={item.onClick} className={finalClasses}>
          <item.icon
            size={18}
            className={`${isOpen ? 'mr-3' : ''} flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-slate-400'}`}
          />
          {isOpen && <span className="transition-opacity duration-200 truncate">{item.label}</span>}
          {!isOpen && (
              <span className="absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white group-hover:block z-50">
                  {item.label}
              </span>
          )}
        </button>
      </li>
    );
  };

  return (
    <aside
      className={`relative bg-white border-r border-slate-200 transition-all duration-300 ease-in-out print:hidden flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center h-16 px-4 border-b border-slate-200 flex-shrink-0 ${isOpen ? 'justify-start' : 'justify-center'}`}>
        <a href="#" className="flex items-center">
            <div className="bg-primary-600 text-white p-2 rounded-lg">
                <Sparkles size={20} className="fill-primary-400 text-white" />
            </div>
            {isOpen && (
                <h1 className="ml-3 text-lg font-bold text-slate-900 whitespace-nowrap">AI Insights</h1>
            )}
        </a>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute -right-3 top-8 bg-white border border-slate-200 p-1 rounded-full text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-transform focus:outline-none focus:ring-2 focus:ring-primary-500 z-10 ${!isOpen && 'rotate-180'}`}
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 p-4 space-y-4">
            {/* New Analysis Button */}
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
          
            {/* Saved Dashboards */}
            <div className="space-y-1">
                {isOpen && <div className="px-1 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">My Dashboards</div>}
                <ul className="space-y-1">
                    {savedDashboards.length === 0 && isOpen && (
                        <p className="text-xs text-slate-400 px-2 py-4 text-center">Your saved dashboards will appear here.</p>
                    )}
                    {savedDashboards.map((dash) => (
                        <NavLink 
                            key={dash.id} 
                            item={{ 
                                icon: Folder, 
                                label: dash.name, 
                                onClick: () => onSelectDashboard(dash.id),
                                id: dash.id 
                            }} 
                            isDashboardLink={true}
                        />
                    ))}
                </ul>
            </div>
        </nav>
        
        {/* Footer Profile */}
        <div className="p-4 mt-auto border-t border-slate-100">
             <button className={`flex items-center w-full p-2 rounded-lg transition-colors group text-slate-600 hover:bg-slate-100 hover:text-slate-900 ${isOpen ? 'justify-start' : 'justify-center'}`}>
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-slate-500"/>
                </div>
                {isOpen && (
                    <div className="ml-3 text-left">
                        <p className="text-sm font-semibold text-slate-800 truncate">{userEmail}</p>
                        <p className="text-xs text-slate-500">View Profile</p>
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
