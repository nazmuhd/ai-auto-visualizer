import React from 'react';
import { Target, BarChart, Settings } from 'lucide-react';

interface SolutionCardProps {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
    color: string;
    illustration: React.ReactNode;
}

const SolutionCard: React.FC<SolutionCardProps> = ({ icon: Icon, title, children, color, illustration }) => (
  <div className={`relative p-8 rounded-2xl border overflow-hidden transition-transform transform hover:-translate-y-2 hover:shadow-2xl ${color}`}>
    <div className="absolute -bottom-8 -right-8 opacity-15">{illustration}</div>
    <div className="relative z-10">
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-md mb-4">
        <Icon className="text-primary-600" size={24} />
      </div>
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="text-slate-600 mt-2">{children}</p>
    </div>
  </div>
);

export const SolutionsSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Designed for Data-Driven Teams</h2>
          <p className="text-lg text-slate-600 mt-2">Get the insights you need, tailored to your role.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SolutionCard 
            icon={Target} 
            title="Sales Performance" 
            color="bg-sky-50 border-sky-200"
            illustration={<Target size={150} className="text-sky-400" />}
          >
            Instantly visualize sales performance, track KPIs against targets, and identify top-performing regions and representatives without waiting for an analyst.
          </SolutionCard>
          <SolutionCard 
            icon={BarChart} 
            title="Marketing Campaign ROI" 
            color="bg-purple-50 border-purple-200"
            illustration={<BarChart size={150} className="text-purple-400" />}
          >
            Go from campaign spreadsheets to ROI analysis in minutes. Understand channel performance, track conversion rates, and generate report-ready charts for stakeholders.
          </SolutionCard>
          <SolutionCard 
            icon={Settings} 
            title="Operational Efficiency" 
            color="bg-emerald-50 border-emerald-200"
            illustration={<Settings size={150} className="text-emerald-400" />}
          >
            Monitor inventory, analyze supply chain efficiency, and track operational metrics with dashboards that are always up-to-date with your latest data upload.
          </SolutionCard>
        </div>
      </div>
    </section>
  );
};
