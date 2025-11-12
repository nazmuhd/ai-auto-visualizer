import React from 'react';
import { Header } from '../landing/Header.tsx';
import { Footer } from '../Footer.tsx';
import { Page } from '../../types.ts';
import { Check, Zap, ShieldCheck, Share2, BarChart3, Users } from 'lucide-react';

interface Props {
  onNavigate: (page: Page) => void;
  onContactClick: () => void;
}

const PricingCard = ({ plan, price, description, features, isPopular }: { plan: string, price: string, description: string, features: string[], isPopular?: boolean }) => (
    <div className={`relative p-8 border rounded-2xl bg-white shadow-lg h-full flex flex-col ${isPopular ? 'border-primary-500' : 'border-slate-200'}`}>
        {isPopular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-sm font-semibold rounded-full">Most Popular</div>}
        <div className="flex-grow">
            <h3 className="text-2xl font-bold text-slate-900">{plan}</h3>
            <p className="mt-2 text-slate-500">{description}</p>
            <div className="mt-6">
                <span className="text-4xl font-extrabold text-slate-900">{price}</span>
                {plan !== 'Free' && <span className="text-slate-500"> / month</span>}
            </div>
            <ul className="mt-8 space-y-3 text-slate-600">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center"><Check size={16} className="text-green-500 mr-2 flex-shrink-0" /> {feature}</li>
                ))}
            </ul>
        </div>
        <button className={`w-full py-3 mt-8 text-sm font-semibold rounded-lg transition-transform transform hover:scale-105 ${isPopular ? 'text-white bg-slate-900 hover:bg-black shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            {plan === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
        </button>
    </div>
);

export const PricingPage: React.FC<Props> = ({ onNavigate, onContactClick }) => {
  return (
    <div className="bg-slate-50">
      <Header onNavigate={onNavigate} onContactClick={onContactClick} />

      <main>
        {/* Pricing Tiers Section */}
        <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Simple, Transparent Pricing</h1>
                    <p className="mt-4 text-lg text-slate-600">Choose the plan that's right for you.</p>
                </div>
                {/* Responsive Grid for Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
                    <PricingCard 
                        plan="Free"
                        price="$0"
                        description="For individuals and small projects."
                        features={['5 Dashboard Saves', 'Unlimited Analyses', 'CSV & Excel Upload', 'Community Support']}
                    />
                    <PricingCard 
                        plan="Pro"
                        price="$29"
                        description="For professionals and growing teams."
                        features={['Unlimited Dashboards', 'Priority Support', 'Advanced Export Options', 'Remove Branding']}
                        isPopular={true}
                    />
                    {/* Wrapper to center the Enterprise card on tablet view */}
                    <div className="md:col-span-2 lg:col-span-1 md:flex md:justify-center">
                        <div className="w-full md:max-w-md lg:max-w-full">
                            <PricingCard 
                                plan="Enterprise"
                                price="Custom"
                                description="For large organizations with custom needs."
                                features={['On-premise Deployment', 'Dedicated Support', 'Custom Integrations', 'Team Management']}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Value Reinforcement Section */}
        <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">Included in Every Plan</h2>
                    <p className="mt-2 text-lg text-slate-600">All the core features you need to succeed.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-slate-800">
                    <div className="flex items-start"><Zap size={20} className="text-primary-600 mr-3 mt-1 flex-shrink-0" /><div><h4 className="font-semibold">Instant AI Analysis</h4><p className="text-sm text-slate-500 mt-1">Get from data to dashboard in seconds.</p></div></div>
                    <div className="flex items-start"><BarChart3 size={20} className="text-primary-600 mr-3 mt-1 flex-shrink-0" /><div><h4 className="font-semibold">Interactive Dashboards</h4><p className="text-sm text-slate-500 mt-1">Filter, edit, and explore your data live.</p></div></div>
                    <div className="flex items-start"><ShieldCheck size={20} className="text-primary-600 mr-3 mt-1 flex-shrink-0" /><div><h4 className="font-semibold">In-Browser Security</h4><p className="text-sm text-slate-500 mt-1">Your data is processed on your machine.</p></div></div>
                    <div className="flex items-start"><Users size={20} className="text-primary-600 mr-3 mt-1 flex-shrink-0" /><div><h4 className="font-semibold">No Expertise Needed</h4><p className="text-sm text-slate-500 mt-1">Designed for everyone, not just analysts.</p></div></div>
                    <div className="flex items-start"><Share2 size={20} className="text-primary-600 mr-3 mt-1 flex-shrink-0" /><div><h4 className="font-semibold">Easy Sharing</h4><p className="text-sm text-slate-500 mt-1">Export your findings as PDF or PNG.</p></div></div>
                </div>
            </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} onContactClick={onContactClick} />
    </div>
  );
};