import React from 'react';
import { Sparkles } from 'lucide-react';
import { Page } from '../../App';

interface Props {
  onNavigate: (page: Page) => void;
  onContactClick: () => void;
}

export const Header: React.FC<Props> = ({ onNavigate, onContactClick }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="flex items-center">
              <div className="bg-primary-600 text-white p-2 rounded-lg">
                <Sparkles size={20} className="fill-primary-400 text-white" />
              </div>
              <h1 className="ml-3 text-lg font-bold text-slate-900">AI Insights</h1>
            </a>
          </div>
          <nav className="hidden md:flex items-center justify-center flex-1 space-x-8">
            <a href="#" onClick={(e) => {e.preventDefault(); onNavigate('about')}} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">About Us</a>
            <a href="#" onClick={(e) => {e.preventDefault(); onNavigate('pricing')}} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Pricing</a>
            <a href="#" onClick={(e) => {e.preventDefault(); onContactClick()}} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Contact Us</a>
          </nav>
          <div className="flex items-center">
            <button onClick={() => onNavigate('login')} className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg shadow-sm transition-transform transform hover:scale-105">
              Login
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
