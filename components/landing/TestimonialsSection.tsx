import React from 'react';
import { Star, TrendingUp, Sparkles } from 'lucide-react';

const StarRating: React.FC = () => (
    <div className="flex items-center text-amber-400">
        {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-current" />)}
    </div>
);

const TestimonialCard: React.FC<{ name: string; title: string; imageUrl: string; children: React.ReactNode; className?: string; }> = 
({ name, title, imageUrl, children, className = '' }) => (
    <div className={`bg-slate-50/70 p-6 rounded-2xl flex flex-col transition-transform transform hover:-translate-y-1 ${className}`}>
        <div className="flex-1">
            <StarRating />
            <p className="text-slate-800 leading-relaxed mt-3">{children}</p>
        </div>
        <div className="mt-4 flex items-center">
            <img className="w-12 h-12 rounded-full object-cover" src={imageUrl} alt={name} />
            <div className="ml-4">
                <p className="font-semibold text-slate-900">{name}</p>
                <p className="text-sm text-slate-500">{title}</p>
            </div>
        </div>
    </div>
);


export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Don't just take our word for it</h2>
          <p className="text-lg text-slate-600 mt-2">See how teams are turning data into decisions with AI Insights.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TestimonialCard 
            name="Sarah J." 
            title="Marketing Manager, InnovateCorp" 
            imageUrl="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=250&h=250&auto=format&fit=crop"
            className="lg:col-span-2"
          >
            "This tool saved my team at least 10 hours a week on reporting. We went from raw data to a presentation-ready dashboard in under five minutes. It's a game-changer."
          </TestimonialCard>

          <TestimonialCard 
            name="Alex D." 
            title="Founder, StartupCo" 
            imageUrl="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=250&h=250&auto=format&fit=crop"
          >
            "As a founder, I wear many hats. This tool is like having a data analyst on my team 24/7."
          </TestimonialCard>

          <div className="bg-primary-600 p-8 rounded-2xl flex flex-col items-center justify-center text-center text-white transition-transform transform hover:-translate-y-1">
            <TrendingUp size={32} />
            <p className="text-5xl font-extrabold mt-2">10x</p>
            <p className="font-medium mt-1">Faster Reporting</p>
            <p className="text-xs text-primary-200 mt-2">Average time saved by our users</p>
          </div>
          
          <TestimonialCard 
            name="Mark C." 
            title="Sales Director, Synergy Corp" 
            imageUrl="https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=250&h=250&auto=format&fit=crop"
            className="lg:col-span-2"
          >
            "The ability to get instant answers during our sales meetings has been incredibly powerful. We can drill down into regions and products live, without having to request a new report."
          </TestimonialCard>
        </div>
      </div>
    </section>
  );
};
