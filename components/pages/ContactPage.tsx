import React from 'react';
import { Header } from '../landing/Header.tsx';
import { Footer } from '../Footer.tsx';
import { Page } from '../../types.ts';

interface Props {
  onNavigate: (page: Page) => void;
}

const InputField = ({ label, id, type = 'text', fullWidth = false }) => (
  <div className={fullWidth ? 'col-span-2' : ''}>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      type={type}
      id={id}
      className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
    />
  </div>
);

const SelectField = ({ label, id, options, fullWidth = false }) => (
    <div className={fullWidth ? 'col-span-2' : ''}>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="relative">
            <select
                id={id}
                className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
            >
                <option>Select...</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
    </div>
);


export const ContactPage: React.FC<Props> = ({ onNavigate }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for contacting sales! We will be in touch shortly.");
    onNavigate('landing');
  };

  return (
    <div className="bg-white">
      <Header onNavigate={onNavigate} />
      <main className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Left Column */}
            <div className="space-y-8">
               <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Contact our sales team</h1>
                <p className="text-lg text-slate-600">Learn how AI Insights can help your business to streamline collaboration and increase productivity.</p>
              </div>
              
              <div>
                <h2 className="text-base font-semibold text-slate-900">When connecting with our team, you can expect us to:</h2>
                <ul className="mt-4 space-y-2 list-disc list-inside text-slate-600">
                  <li>Understand your current business processes</li>
                  <li>Explore how our functionality can help you to drastically improve your team's workflow</li>
                  <li>Determine the ideal plan and talk through pricing options</li>
                  <li>Answer any additional specific questions you have</li>
                </ul>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">Looking for immediate support?</h2>
                <ul className="mt-4 space-y-2 list-disc list-inside text-slate-600">
                  <li>For sales, call +1 855 237 6726</li>
                  <li>For technical and/or billing help, check our <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing'); const el = document.getElementById('faq'); el?.scrollIntoView({ behavior: 'smooth'}); }} className="font-medium text-primary-600 hover:underline">FAQ</a>.</li>
                </ul>
              </div>
              
              <div className="!mt-16">
                <p className="text-sm text-center text-slate-500 mb-4">Join innovative companies who trust us</p>
                <div className="grid grid-cols-6 gap-3">
                    <div className="col-span-4 p-4 bg-slate-100/80 rounded-xl flex items-center justify-center">
                    <p className="font-bold text-lg text-slate-600">Vercel</p>
                    </div>
                    <div className="col-span-2 p-4 bg-slate-100/80 rounded-xl flex items-center justify-center">
                    <p className="font-bold text-lg text-slate-600">Loom</p>
                    </div>
                    <div className="col-span-2 p-4 bg-slate-100/80 rounded-xl flex items-center justify-center">
                    <p className="font-bold text-lg text-slate-600">Linear</p>
                    </div>
                    <div className="col-span-4 p-4 bg-slate-100/80 rounded-xl flex items-center justify-center">
                    <p className="font-bold text-lg text-slate-600">Retool</p>
                    </div>
                    <div className="col-span-3 p-4 bg-slate-100/80 rounded-xl flex items-center justify-center">
                    <p className="font-bold text-lg text-slate-600">Zapier</p>
                    </div>
                    <div className="col-span-3 p-4 bg-slate-100/80 rounded-xl flex items-center justify-center">
                    <p className="font-bold text-lg text-slate-600">Notion</p>
                    </div>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200/80">
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                <InputField label="First Name" id="firstName" />
                <InputField label="Last Name" id="lastName" />
                <InputField label="Work email address" id="email" type="email" fullWidth />
                <InputField label="Phone Number" id="phone" type="tel" fullWidth />
                <InputField label="Company name" id="companyName" />
                <SelectField label="Company size" id="companySize" options={['1-50', '51-200', '201-1000', '1001+']} />
                <InputField label="Job Title" id="jobTitle" />
                <SelectField label="Country" id="country" options={['United States', 'Canada', 'United Kingdom', 'Australia']} />
                
                <SelectField 
                  label="How can our sales team help you?" 
                  id="help" 
                  options={['Evaluate for my team', 'Learn about pricing', 'Request a demo']} 
                  fullWidth 
                />
                <SelectField 
                  label="Primary product of interest" 
                  id="product" 
                  options={['AI Dashboards', 'Report Studio', 'Data Connectors']}
                  fullWidth 
                />

                <div className="col-span-2">
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Let us know any additional information that is relevant for your business requirements"
                  ></textarea>
                </div>
                
                <div className="col-span-2">
                    <p className="text-xs text-slate-500">
                        By submitting this form, I authorise Dropbox to contact me about product offerings, services, events and other marketing materials. I may unsubscribe at any time. To learn more, see our <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>.
                    </p>
                </div>
                
                <div className="col-span-2">
                  <button
                    type="submit"
                    className="w-full py-3 text-white rounded-lg font-semibold shadow-sm transition-transform transform hover:scale-[1.02] bg-primary-600 hover:bg-primary-700"
                  >
                    Contact Sales
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};