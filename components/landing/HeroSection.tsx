import React from 'react';
import { Page } from '../../App';
import { ArrowRight, Video } from 'lucide-react';

const companies = [
  "Apex Analytics", "QuantumLeap AI", "Synergy Corp", "Starlight Solutions",
  "Innovate LLC", "DataDriven Inc.", "Summit Logistics", "Helios Systems",
  "Apex Analytics", "QuantumLeap AI", "Synergy Corp", "Starlight Solutions",
  "Innovate LLC", "DataDriven Inc.", "Summit Logistics", "Helios Systems",
];

export const HeroSection: React.FC<{ onNavigate: (page: Page) => void; }> = ({ onNavigate }) => {
  return (
    <section className="relative bg-white h-screen flex flex-col justify-center text-center overflow-hidden">
        {/* Animated background pattern - FIX: Removed mask-image to cover full viewport */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>

      {/* FIX: Changed to a flex-col layout to center content properly */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
            Turn Your Data Into <span className="text-primary-600">Interactive Dashboards</span> in Seconds
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600">
            Stop wrestling with spreadsheets. Upload your data and let our AI automatically generate beautiful, insightful visualizations for you.
            </p>
            <div className="mt-8 flex justify-center items-center space-x-4">
            <button
                onClick={() => onNavigate('signup')}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-lg transition-transform transform hover:scale-105 flex items-center"
            >
                Start Analyzing for Free <ArrowRight size={16} className="ml-2" />
            </button>
            <button
                className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-medium shadow-sm transition-transform transform hover:scale-105 flex items-center"
            >
                <Video size={16} className="mr-2" /> Watch a Demo
            </button>
            </div>
        </div>
      </div>
      
      {/* Animated Company Marquee - Positioned at the bottom */}
      <div className="relative z-10 w-full py-10">
        <div className="text-center mb-4 text-sm font-medium text-slate-500">Trusted by teams at the world's best companies</div>
        <div className="relative w-full overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-16 before:bg-gradient-to-r before:from-white before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-16 after:bg-gradient-to-l after:from-white after:to-transparent">
          <div className="flex animate-marquee motion-safe:animate-marquee">
            {companies.map((name, index) => (
              <div key={index} className="flex-shrink-0 mx-6 text-2xl font-bold text-slate-400">
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
       <style>{`
            @keyframes marquee {
                from { transform: translateX(0%); }
                to { transform: translateX(-50%); }
            }
            .animate-marquee {
                animation: marquee 40s linear infinite;
            }
        `}</style>
    </section>
  );
};
