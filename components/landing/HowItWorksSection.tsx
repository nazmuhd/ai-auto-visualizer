
import React from 'react';
import { UploadCloud, BrainCircuit, BarChart3 } from 'lucide-react';

// FIX: Changed component definition to use React.FC and an interface for props to improve type safety and resolve inference issues with the `children` prop.
interface StepCardProps {
    number: string;
    title: string;
    children: React.ReactNode;
    className?: string;
}

const StepCard: React.FC<StepCardProps> = ({ number, title, children, className }) => (
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
                <style>{`
                    @keyframes march {
                        to {
                            stroke-dashoffset: -44; /* Adjusted for the new dash array pattern */
                        }
                    }
                    .animate-path-dots {
                        animation: march 2s linear infinite;
                    }
                `}</style>
                {/* SVG Wave and Animation Path */}
                <svg width="120%" height="100%" viewBox="0 -40 1200 200" preserveAspectRatio="xMidYMid slice" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <defs>
                        {/* The new path starts at the first card, goes through the second, and ends at the third. */}
                        <path id="wavy-path" d="M 270 -28 Q 435 150, 600 61 T 930 -28" fill="none" />
                    </defs>
                    
                    {/* The animated, rounded-circle line */}
                    <use 
                        href="#wavy-path" 
                        strokeDasharray="0 22" 
                        stroke="#94a3b8" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        className="animate-path-dots"
                    />
                </svg>

                {/* Positioned Step Cards for Desktop, aligned to the wave */}
                <div className="absolute w-full h-full">
                    <div className="absolute top-[5%]" style={{left: '17%', transform: 'translateX(-50%)'}}><StepCard number="1" title="Upload Your Data" className="transform -rotate-6">Securely upload your CSV or Excel file. Your data is processed directly in your browser.</StepCard></div>
                    <div className="absolute top-[42%]" style={{left: '50%', transform: 'translateX(-50%) translateY(-50%)'}}><StepCard number="2" title="AI-Powered Analysis" className="transform rotate-2">Our AI analyzes your data to identify key metrics and suggest effective visualizations.</StepCard></div>
                    <div className="absolute top-[5%]" style={{left: '83%', transform: 'translateX(-50%)'}}><StepCard number="3" title="Visualize & Interact" className="transform -rotate-3">Receive a fully interactive dashboard. Filter, drill down, and customize charts to uncover stories.</StepCard></div>
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
