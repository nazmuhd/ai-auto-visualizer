import React from 'react';
import { Check, X, Clock, Zap, UserCheck, ShieldCheck, Share2, Users } from 'lucide-react';

const comparisonData = [
    { feature: "Time to Insight", icon: Clock, us: true, them: false, us_text: "Minutes", them_text: "Hours or Days" },
    { feature: "Instant AI Analysis", icon: Zap, us: true, them: false, us_text: "Automated", them_text: "Manual" },
    { feature: "Technical Expertise Required", icon: UserCheck, us: false, them: true, us_text: "None", them_text: "High" },
    { feature: "Data Accessibility", icon: Users, us: true, them: false, us_text: "For Everyone", them_text: "For Analysts" },
    { feature: "In-Browser Data Security", icon: ShieldCheck, us: true, them: false, us_text: "By Default", them_text: "N/A" },
    { feature: "Sharing & Collaboration", icon: Share2, us: true, them: false, us_text: "Built-in", them_text: "Manual Export" },
];

const ComparisonRowDesktop: React.FC<{ feature: string; icon: React.ElementType; us: boolean; them: boolean }> = ({ feature, icon: Icon, us, them }) => (
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
                    <div className="hidden sm:block">
                        <div className="grid grid-cols-3 gap-4 pb-4 border-b-2 border-slate-200">
                            <div className="font-semibold text-slate-800">Feature</div>
                            <div className="font-semibold text-slate-800 text-center">AI Insights</div>
                            <div className="font-semibold text-slate-800 text-center">The Old Way</div>
                        </div>
                        <div>
                           {comparisonData.map((item) => <ComparisonRowDesktop key={item.feature} feature={item.feature} icon={item.icon} us={item.us} them={item.them} />)}
                        </div>
                    </div>
                    <div className="sm:hidden space-y-4">
                        {comparisonData.map(({ feature, icon: Icon, us, them, us_text, them_text }) => (
                            <div key={feature} className="p-4 rounded-lg border border-slate-200">
                                <div className="flex items-center mb-4 font-semibold text-slate-800">
                                    <Icon size={18} className="mr-3 text-primary-600" />
                                    {feature}
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between p-3 rounded bg-green-50/50">
                                        <span className="font-medium text-green-800">AI Insights:</span>
                                        <span className="font-bold text-green-700">{us_text}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded bg-red-50/50">
                                        <span className="font-medium text-red-800">The Old Way:</span>
                                        <span className="font-bold text-red-700">{them_text}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
