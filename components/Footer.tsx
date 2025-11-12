import React from 'react';
import { Sparkles, Linkedin, Twitter, ArrowRight } from 'lucide-react';
import { Page } from '../types.ts';

interface Props {
  onNavigate: (page: Page) => void;
  onContactClick: () => void;
}

export const Footer: React.FC<Props> = ({ onNavigate, onContactClick }) => {
  return (
    <footer className="bg-black text-slate-300">
      {/* Pre-footer CTA */}
      <div className="bg-slate-800">
         <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold text-white">Ready to Unlock Your Data's Potential?</h2>
            <p className="mt-4 text-lg text-slate-200">Get started for free. No credit card required.</p>
            <div className="mt-8">
                 <button
                    onClick={() => onNavigate('signup')}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-slate-900 hover:bg-black transition-transform transform hover:scale-105"
                >
                    Start Analyzing Now
                    <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
                </button>
            </div>
        </div>
      </div>
      
       {/* Decorative Wave Separator */}
      <div className="bg-slate-800 leading-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 32" className="block fill-black">
            <path d="M0,32L1440,0L1440,32L0,32Z"></path>
        </svg>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <a href="#" onClick={(e) => {e.preventDefault(); onNavigate('landing')}} className="flex items-center">
              <div className="bg-white/10 backdrop-blur-sm text-white p-2 rounded-lg">
                <Sparkles size={20} className="fill-slate-400 text-white" />
              </div>
              <h1 className="ml-3 text-lg font-bold text-white">AI Insights</h1>
            </a>
            <p className="text-sm text-slate-400">Transforming Data into Decisions.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white"><Twitter size={20}/></a>
              <a href="#" className="text-slate-400 hover:text-white"><Linkedin size={20}/></a>
            </div>
          </div>
          {/* Column 2: Product */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">Product</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#comparison" className="text-base text-slate-400 hover:text-white">Features</a></li>
              <li><a href="#" onClick={(e) => {e.preventDefault(); onNavigate('pricing')}} className="text-base text-slate-400 hover:text-white">Pricing</a></li>
            </ul>
          </div>
          {/* Column 3: Company */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" onClick={(e) => {e.preventDefault(); onNavigate('about')}} className="text-base text-slate-400 hover:text-white">About Us</a></li>
              <li><a href="#" onClick={(e) => {e.preventDefault(); onContactClick()}} className="text-base text-slate-400 hover:text-white">Contact</a></li>
            </ul>
          </div>
          {/* Column 4: Legal */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-base text-slate-400 hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="text-base text-slate-400 hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-700/50 pt-8 text-center">
           <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} AI Insights. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};