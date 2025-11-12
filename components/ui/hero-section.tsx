'use client';

import React from 'react';
import { Page } from '../../types.ts';
import { Sparkles, ArrowRight, Video, Menu, X } from 'lucide-react';

interface Props {
  onNavigate: (page: Page) => void;
  onContactClick: () => void;
}

const companies = [
  "Apex Analytics", "QuantumLeap AI", "Synergy Corp", "Starlight Solutions",
  "Innovate LLC", "DataDriven Inc.", "Summit Logistics", "Helios Systems",
  "Apex Analytics", "QuantumLeap AI", "Synergy Corp", "Starlight Solutions",
  "Innovate LLC", "DataDriven Inc.", "Summit Logistics", "Helios Systems",
];

export default function HeroSection({ onNavigate, onContactClick }: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  // Close on ESC & click outside (mobile overlay)
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }

    if (menuOpen) {
      document.addEventListener('keydown', onKey);
      document.addEventListener('click', onClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClickOutside);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMenuOpen(false);
  }

  const handleContact = () => {
      onContactClick();
      setMenuOpen(false);
  }

  return (
    <>
      <section className="bg-[url('https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/hero/gridBackground.png')] w-full bg-no-repeat bg-cover bg-center text-sm pb-24">
        <nav className="flex items-center justify-between p-4 md:px-16 lg:px-24 xl:px-32 md:py-6 w-full">
           <a href="#" onClick={(e) => { e.preventDefault(); handleNav('landing'); }} className="flex items-center">
                <div className="bg-slate-900 text-white p-2 rounded-lg">
                  <Sparkles size={20} className="fill-slate-400 text-white" />
                </div>
                <h1 className="ml-3 text-lg font-bold text-slate-900">AI Insights</h1>
            </a>

          <div
            id="menu"
            ref={menuRef}
            className={[
              'max-md:fixed max-md:top-0 max-md:left-0 max-md:transition-all max-md:duration-300 max-md:overflow-hidden max-md:h-full max-md:bg-white/80 max-md:backdrop-blur-sm z-50',
              'flex items-center gap-8 font-medium text-slate-800',
              'max-md:flex-col max-md:justify-center',
              menuOpen ? 'max-md:w-full' : 'max-md:w-0',
            ].join(' ')}
            aria-hidden={!menuOpen}
          >
            <a href="#" onClick={(e) => { e.preventDefault(); handleNav('about'); }} className="hover:text-gray-600">About Us</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNav('pricing'); }} className="hover:text-gray-600">Pricing</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleContact(); }} className="hover:text-gray-600">Contact Us</a>

            <button
              onClick={() => setMenuOpen(false)}
              className="md:hidden absolute top-5 right-5 bg-slate-800 hover:bg-black text-white p-2 rounded-md aspect-square font-medium transition"
              aria-label="Close menu"
            >
                <X size={24} />
            </button>
          </div>

          <button onClick={() => handleNav('login')} className="hidden md:block bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-full font-medium transition-transform transform hover:scale-105">
            Login
          </button>

          <button
            id="open-menu"
            onClick={() => setMenuOpen(true)}
            className="md:hidden bg-slate-900 hover:bg-black text-white p-2 rounded-md aspect-square font-medium transition"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </nav>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 max-w-4xl text-center mx-auto mt-24 md:mt-32 tracking-tight">
          Turn Your Data Into <span className="text-primary-600">Interactive Dashboards</span> in Seconds
        </h1>

        <p className="text-base md:text-lg mx-auto max-w-2xl text-slate-600 text-center mt-6 max-md:px-2">
          Stop wrestling with spreadsheets. Upload your data and let our AI automatically generate beautiful, insightful visualizations for you.
        </p>

        <div className="mx-auto w-full flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button onClick={() => handleNav('signup')} className="px-6 py-3 rounded-full font-medium text-white bg-slate-900 hover:bg-black shadow-lg transition-transform transform hover:scale-105 flex items-center">
            Start Analyzing for Free <ArrowRight size={16} className="ml-2" />
          </button>
          <button className="flex items-center gap-2 border border-slate-300 hover:bg-slate-200/30 rounded-full px-6 py-3 font-medium text-slate-700 shadow-sm transform hover:scale-105 transition-transform">
            <Video size={16} />
            <span>Watch a Demo</span>
          </button>
        </div>

        <div className="w-full pt-24 mt-12">
            <div className="text-center mb-4 text-sm font-medium text-slate-500">Trusted by teams at the world's best companies</div>
             <div className="relative w-full overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-16 before:bg-gradient-to-r from-white before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-16 after:bg-gradient-to-l after:from-white after:to-transparent">
                <div className="flex animate-marquee motion-safe:animate-marquee">
                    {companies.map((name, index) => (
                    <div key={index} className="flex-shrink-0 mx-6 text-2xl font-bold text-slate-400">
                        {name}
                    </div>
                    ))}
                </div>
            </div>
        </div>
      </section>
      <style>{`
            @keyframes marquee {
                from { transform: translateX(0%); }
                to { transform: translateX(-50%); }
            }
            .animate-marquee {
                animation: marquee 40s linear infinite;
            }
        `}</style>
    </>
  );
}
