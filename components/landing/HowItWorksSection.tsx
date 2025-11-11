import React from 'react';
import { UploadCloud, BrainCircuit, BarChart3, Paperclip } from 'lucide-react';

const StepCard = ({ number, title, children, className }: { number: string, title: string, children: React.ReactNode, className?: string }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-lg border border-slate-100 w-full sm:w-80 ${className}`}>
        <div className="flex items-center mb-3">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-lg border-4 border-white ring-2 ring-primary-100">
                {number}
            </div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm">{children}</p>
    </div>
);

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900">Get Your Dashboard in 3 Simple Steps</h2>
                <p className="text-lg text-slate-600 mt-2">From raw data to rich insights in minutes.</p>
            </div>
            
            <div className="relative h-[400px] hidden lg:flex items-center justify-center">
                {/* SVG Wave and Animation Path */}
                <svg width="110%" height="100%" viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <defs>
                        <path id="wavy-path" d="M 0 60 C 200 0, 400 120, 600 60 S 1000 0, 1200 60" fill="none" />
                    </defs>
                    
                    {/* The visible dotted line */}
                    <use href="#wavy-path" strokeDasharray="5, 10" stroke="#cbd5e1" strokeWidth="2" />
                    
                    {/* The paper plane icon and its animation */}
                    <g>
                        <path d="M22 2L11 13" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" fill="#38bdf8" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <animateMotion dur="10s" repeatCount="indefinite" rotate="auto">
                            <mpath href="#wavy-path" />
                        </animateMotion>
                    </g>
                </svg>

                {/* Positioned Step Cards for Desktop */}
                <div className="absolute w-full h-full">
                    <div className="absolute top-[20%]" style={{left: '5%'}}><StepCard number="1" title="Upload Your Data" className="transform -rotate-6">Securely upload your CSV or Excel file. Your data is processed directly in your browser.</StepCard></div>
                    <div className="absolute top-[50%]" style={{left: '50%', transform: 'translateX(-50%) translateY(-50%)'}}><StepCard number="2" title="AI-Powered Analysis" className="transform rotate-2">Our AI analyzes your data to identify key metrics and suggest effective visualizations.</StepCard></div>
                    <div className="absolute top-[20%]" style={{left: 'auto', right: '5%'}}><StepCard number="3" title="Visualize & Interact" className="transform -rotate-3">Receive a fully interactive dashboard. Filter, drill down, and customize charts to uncover stories.</StepCard></div>
                </div>
            </div>

            {/* Mobile/Tablet Fallback view */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <div className="flex items-center mb-3"><div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-lg">1</div></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Your Data</h3><p className="text-slate-600 text-sm">Securely upload your CSV or Excel file.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                     <div className="flex items-center mb-3"><div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-lg">2</div></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">AI-Powered Analysis</h3><p className="text-slate-600 text-sm">Our AI suggests effective visualizations.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                     <div className="flex items-center mb-3"><div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-lg">3</div></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Visualize & Interact</h3><p className="text-slate-600 text-sm">Receive a fully interactive dashboard.</p>
                </div>
            </div>
        </div>
    </section>
  );
};
