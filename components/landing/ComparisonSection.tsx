import React from 'react';
import { Check, X, Clock, Zap, UserCheck, ShieldCheck, Share2, Users } from 'lucide-react';

const ComparisonRow = ({ feature, icon: Icon, us, them }: { feature: string, icon: React.ElementType, us: boolean, them: boolean }) => (
    <div className="grid grid-cols-3 gap-4 items-center py-4 border-b border-slate-100 last:border-b-0">
        <div className="flex items-center">
            <Icon size={18} className="mr-3 text-primary-600 flex-shrink-0" />
            <span className="font-medium text-slate-700">{feature}</span>
        </div>
        <div className="flex justify-center">
            {us ? <Check size={24} className="text-green-500" /> : <X size={24} className="text-slate-300" />}
        </div>
        <div className="flex justify-center">
            {them ? <Check size={24} className="text-green-500" /> : <X size={24} className="text-red-500" />}
        </div>
    </div>
);

export const ComparisonSection: React.FC = () => {
    return (
        <section id="comparison" className="py-20 bg-slate-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">Stop the Grind. Start the Analysis.</h2>
                    <p className="text-lg text-slate-600 mt-2">See how AI Insights stacks up against traditional methods.</p>
                </div>
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                    <div className="grid grid-cols-3 gap-4 pb-4 border-b-2 border-slate-200">
                        <div className="font-semibold text-slate-800">Feature</div>
                        <div className="font-semibold text-slate-800 text-center">AI Insights</div>
                        <div className="font-semibold text-slate-800 text-center">The Old Way</div>
                    </div>
                    <div>
                        <ComparisonRow feature="Time to Insight" icon={Clock} us={true} them={false} />
                        <ComparisonRow feature="Instant AI Analysis" icon={Zap} us={true} them={false} />
                        <ComparisonRow feature="Technical Expertise Required" icon={UserCheck} us={false} them={true} />
                        <ComparisonRow feature="Data Accessibility" icon={Users} us={true} them={false} />
                        <ComparisonRow feature="In-Browser Data Security" icon={ShieldCheck} us={true} them={false} />
                        <ComparisonRow feature="Sharing & Collaboration" icon={Share2} us={true} them={false} />
                    </div>
                </div>
            </div>
        </section>
    );
};
