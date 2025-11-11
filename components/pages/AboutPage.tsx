import React from 'react';
import { Header } from '../landing/Header.tsx';
import { Footer } from '../Footer.tsx';
import { Page } from '../../types.ts';
import { Lightbulb, ShieldCheck, Zap, Linkedin } from 'lucide-react';

interface Props {
  onNavigate: (page: Page) => void;
  onContactClick: () => void;
}

const teamMembers = [
  { name: 'Alice Johnson', title: 'Founder & CEO', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=250&h=250&auto=format&fit=crop' },
  { name: 'Bob Williams', title: 'Lead Data Scientist', img: 'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=250&h=250&auto=format&fit=crop' },
  { name: 'Charlie Brown', title: 'Head of Product', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=250&h=250&auto=format&fit=crop' },
  { name: 'Diana Miller', title: 'Senior Frontend Engineer', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=250&h=250&auto=format&fit=crop' },
];

export const AboutPage: React.FC<Props> = ({ onNavigate, onContactClick }) => {
  return (
    <div className="bg-white">
      <Header onNavigate={onNavigate} onContactClick={onContactClick} />

      <main>
        {/* Hero Section */}
        <section className="relative h-96 flex items-center justify-center text-center bg-slate-800 text-white">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1740&auto=format&fit=crop')" }}></div>
          <div className="relative z-10 max-w-4xl mx-auto px-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Democratizing Data for Everyone</h1>
            <p className="mt-4 text-lg text-slate-300">We believe that powerful data insights shouldn't be complicated or reserved for experts. Our mission is to make data analysis instant, intuitive, and accessible to all.</p>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Our Story</h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Founded in a small garage with a big idea, AI Insights was born from the frustration of spending hours building manual reports. We knew there had to be a better way. By harnessing the power of generative AI, we've built a tool that automates the most tedious parts of data analysis, allowing you to focus on what truly matters: making informed decisions.
              </p>
            </div>
            <div className="space-y-4">
               {/* Timeline-like items */}
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-primary-500 mr-4"></div><p><span className="font-semibold">2022:</span> The idea is born.</p></div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-primary-500 mr-4"></div><p><span className="font-semibold">2023:</span> First prototype developed.</p></div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-primary-500 mr-4"></div><p><span className="font-semibold">2024:</span> Public launch!</p></div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="py-20 bg-slate-50">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900">The Values That Drive Us</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="p-8"><Lightbulb size={32} className="mx-auto text-primary-600 mb-4"/>
                    <h3 className="text-xl font-semibold">Simplicity</h3><p className="mt-2 text-slate-600">Powerful tools should be easy to use.</p></div>
                <div className="p-8"><ShieldCheck size={32} className="mx-auto text-primary-600 mb-4"/>
                    <h3 className="text-xl font-semibold">Security</h3><p className="mt-2 text-slate-600">Your data privacy is our top priority.</p></div>
                <div className="p-8"><Zap size={32} className="mx-auto text-primary-600 mb-4"/>
                    <h3 className="text-xl font-semibold">Speed</h3><p className="mt-2 text-slate-600">From data to decision in record time.</p></div>
            </div>
           </div>
        </section>
        
        {/* Meet the Team Section */}
        <section className="py-20">
           <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">Meet the Team</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {teamMembers.map(member => (
                        <div key={member.name} className="text-center group">
                           <div className="relative">
                                <img src={member.img} alt={member.name} className="w-32 h-32 rounded-full mx-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                                <a href="#" className="absolute bottom-2 right-2 p-2 bg-white rounded-full text-slate-600 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Linkedin size={16} />
                                </a>
                           </div>
                           <h3 className="mt-4 font-semibold text-slate-800">{member.name}</h3>
                           <p className="text-sm text-slate-500">{member.title}</p>
                        </div>
                    ))}
                </div>
           </div>
        </section>

      </main>

      <Footer onNavigate={onNavigate} onContactClick={onContactClick} />
    </div>
  );
};