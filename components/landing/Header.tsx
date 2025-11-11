
import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X } from 'lucide-react';
import { Page } from '../../types.ts';

interface Props {
  onNavigate: (page: Page) => void;
  onContactClick: () => void;
}

export const Header: React.FC<Props> = ({ onNavigate, onContactClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  const handleNav = (page: Page) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  }
  
  const handleContact = () => {
      onContactClick();
      setIsMobileMenuOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="#" onClick={(e) => { e.preventDefault(); handleNav('landing'); }} className="flex items-center">
                <div className="bg-primary-600 text-white p-2 rounded-lg">
                  <Sparkles size={20} className="fill-primary-400 text-white" />
                </div>
                <h1 className="ml-3 text-lg font-bold text-slate-900">AI Insights</h1>
              </a>
            </div>
            <nav className="hidden md:flex items-center justify-center flex-1 space-x-8">
              <a href="#" onClick={(e) => {e.preventDefault(); handleNav('about')}} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">About Us</a>
              <a href="#" onClick={(e) => {e.preventDefault(); handleNav('pricing')}} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Pricing</a>
              <a href="#" onClick={(e) => {e.preventDefault(); handleContact()}} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Contact Us</a>
            </nav>
            <div className="flex items-center">
              <div className="hidden md:block">
                <button onClick={() => handleNav('login')} className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg shadow-sm transition-transform transform hover:scale-105">
                  Login
                </button>
              </div>
              <div className="md:hidden">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-slate-600 hover:bg-slate-100">
                  <span className="sr-only">Open menu</span>
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white md:hidden animate-in fade-in duration-200">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
                <a href="#" onClick={(e) => { e.preventDefault(); handleNav('landing'); }} className="flex items-center">
                  <div className="bg-primary-600 text-white p-2 rounded-lg">
                    <Sparkles size={20} className="fill-primary-400 text-white" />
                  </div>
                  <h1 className="ml-3 text-lg font-bold text-slate-900">AI Insights</h1>
                </a>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-md text-slate-600 hover:bg-slate-100">
                   <span className="sr-only">Close menu</span>
                   <X size={24} />
                </button>
            </div>
            <nav className="flex-1 flex flex-col items-center justify-center space-y-8">
              <a href="#" onClick={(e) => {e.preventDefault(); handleNav('about')}} className="text-xl font-medium text-slate-700 hover:text-primary-600">About Us</a>
              <a href="#" onClick={(e) => {e.preventDefault(); handleNav('pricing')}} className="text-xl font-medium text-slate-700 hover:text-primary-600">Pricing</a>
              <a href="#" onClick={(e) => {e.preventDefault(); handleContact()}} className="text-xl font-medium text-slate-700 hover:text-primary-600">Contact Us</a>
               <button onClick={() => handleNav('login')} className="px-8 py-3 text-lg font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-sm">
                  Login
                </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};