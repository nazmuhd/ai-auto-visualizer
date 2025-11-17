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
            <div className="prose prose-slate max-w-none prose-h1:text-4xl prose-h1:font-extrabold prose-h2:font-semibold prose-p:leading-relaxed">
              <h1>Contact our sales team</h1>
              <p className="lead">Learn how AI Insights can help your business to streamline collaboration and increase productivity.</p>
              
              <h2>When connecting with our team, you can expect us to:</h2>
              <ul>
                <li>Understand your current business processes</li>
                <li>Explore how our functionality can help you to drastically improve your team's workflow</li>
                <li>Determine the ideal plan and talk through pricing options</li>
                <li>Answer any additional specific questions you have</li>
              </ul>

              <h2>Looking for immediate support?</h2>
              <ul>
                <li>For sales, call +1 855 237 6726</li>
                <li>For technical and/or billing help, check our <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing'); const el = document.getElementById('faq'); el?.scrollIntoView({ behavior: 'smooth'}); }}>FAQ</a>.</li>
              </ul>
              
              <div className="mt-16 flex items-center justify-between gap-x-8 gap-y-6 flex-wrap grayscale opacity-60">
                <svg className="h-8" viewBox="0 0 105 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.33 28.53h-4.3V3.5h4.3v25.03zM32.53 23.36c0 3.1-2.45 5.55-5.55 5.55-3.1 0-5.55-2.45-5.55-5.55s2.45-5.55 5.55-5.55c3.1 0 5.55 2.45 5.55 5.55zm-6.8-20.86h-4.3v10.65a5.52 5.52 0 0 1 4.3-1.8c3.1 0 5.55 2.45 5.55 5.55s-2.45 5.55-5.55 5.55a5.52 5.52 0 0 1-4.3-1.8V28.53h-4.3V3.5h13.1v-1zM48.2 11.75c-3.1 0-5.55 2.45-5.55 5.55s2.45 5.55 5.55 5.55c3.1 0 5.55-2.45 5.55-5.55s-2.45-5.55-5.55-5.55zm0 16.78c-6.25 0-11.25-5-11.25-11.25s5-11.25 11.25-11.25c6.25 0 11.25 5 11.25 11.25s-5 11.25-11.25 11.25zM68.61 22.36l-4.2-3.8c-1.4 1.15-3.3 1.8-5.3 1.8-4.4 0-8-3.6-8-8s3.6-8 8-8c4.4 0 8 3.6 8 8 0 1.9-.65 3.7-1.8 5.1l4.1 3.9-1.8 1zM78.69 11.75c-3.1 0-5.55 2.45-5.55 5.55s2.45 5.55 5.55 5.55c3.1 0 5.55-2.45 5.55-5.55s-2.45-5.55-5.55-5.55zm0 16.78c-6.25 0-11.25-5-11.25-11.25s5-11.25 11.25-11.25c6.25 0 11.25 5 11.25 11.25s-5 11.25-11.25 11.25zM99.36 12.3c-1.4-.7-3.05-.7-4.45 0l-3.9 1.95v1.4l5.3-2.65c.95-.45 2.05-.45 3 0l5.3 2.65v-1.4l-1.3-.65-3.95-2zM95.21 22.7l-4.2-2.1v-1.4l5.6 2.8c.9.45 2.05.45 2.95 0l5.5-2.8v1.4l-4.15 2.1c-1.45.7-3.05.7-4.5 0z" fill="currentColor"></path></svg>
                <svg className="h-8" viewBox="0 0 250 82" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M125.044 40.854c22.615 0 40.941-18.327 40.941-40.854C165.985 18.327 147.659 0 125.044 0 102.428 0 84.102 18.327 84.102 40.854c0 22.527 18.326 40.854 40.942 40.854zm0-20.427c-11.258 0-20.47 9.159-20.47 20.427s9.212 20.427 20.47 20.427 20.47-9.159 20.47-20.427-9.212-20.427-20.47-20.427zM40.942 40.854C18.326 40.854 0 22.527 0 0h20.47c11.258 0 20.471 9.159 20.471 20.427S31.728 40.854 20.47 40.854H0v40.854h40.942V40.854zM209.13 40.854c22.616 0 40.942-18.327 40.942-40.854H229.6c-11.258 0-20.47 9.159-20.47 20.427S218.342 40.854 229.6 40.854h20.472v40.854H209.13V40.854z" fill="currentColor"></path></svg>
                <svg className="h-6" viewBox="0 0 125 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M117.2 17.4V.4h4.8v17h-4.8zM98.6 12.4c0 3 .2 4.9 2.7 4.9s2.6-2 2.6-4.9V.4h4.8v12c0 5.6-2.5 8-7.5 8s-7.3-2.4-7.3-8V.4h4.7v12zM75.9.4l7.6 17h-5l-1.3-3.2H68l-1.3 3.2h-5L69.3.4h6.6zm-1.8 10.3l-2-5-2 5h4zM49.6 17.4V.4h11.7v3.2H54.4V7h6.6v3.2H54.4v4h7v3.2H49.6zM32 .4l7.6 17h-5l-1.3-3.2h-9.2l-1.3 3.2h-5L29.4.4H32zm-1.8 10.3l-2-5-2 5h4zM10.9 17.4L0 8.7 10.9 0l3.4 2.4-8.2 6.3 8.2 6.3-3.4 2.4z" fill="currentColor"></path></svg>
                <svg className="h-8" viewBox="0 0 86 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.24 19.46V4.1h3.44v15.36h-3.44zM32.88 4.1h-4.4L23.2 12.3V4.1h-3.44v15.36h3.2l9.92-9.28v9.28h3.44V4.1zM48.24 16.5c-4.32 0-7.36-2.64-7.36-6.8s3.04-6.8 7.36-6.8c2.48 0 4.4.96 5.68 2.32l-2.4 2.16c-.8-.8-1.84-1.28-3.12-1.28-2.08 0-3.68 1.44-3.68 4.56s1.6 4.56 3.68 4.56c1.28 0 2.32-.48 3.12-1.28l2.4 2.16c-1.28 1.36-3.2 2.32-5.68 2.32zM71.76 4.1h-3.44v8.56L63.84 4.1h-4.4v15.36h3.44V10.8l4.48 8.64h3.84V4.1zM85.44 4.1h-6.88v3.36h6.88v3.2h-6.88v5.44h6.88v3.36h-10.32V.72h10.32v3.36z" fill="currentColor"></path></svg>
              </div>
            </div>

            {/* Right Column - Form */}
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <InputField label="First Name:" id="firstName" />
                <InputField label="Last Name:" id="lastName" />
                <InputField label="Work email address:" id="email" type="email" fullWidth />
                <InputField label="Phone Number:" id="phone" type="tel" fullWidth />
                <InputField label="Company name:" id="companyName" />
                <SelectField label="Company size:" id="companySize" options={["1-50", "51-200", "201-1000", "1001+"]} />
                <InputField label="Job Title:" id="jobTitle" />
                <SelectField label="Country:" id="country" options={["United States", "Canada", "United Kingdom", "Australia", "Other"]} />
                <SelectField label="How can our sales team help you?" id="help" options={["General Inquiry", "Pricing Question", "Demo Request"]} fullWidth />
                <SelectField label="Primary product of interest" id="interest" options={["Pro Plan", "Enterprise Plan"]} fullWidth />
                
                <div className="col-span-2">
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Message:</label>
                    <textarea
                        id="message"
                        rows={4}
                        className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="Let us know any additional information that is relevant for your business requirements"
                    ></textarea>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-6">
                By submitting this form, I authorise AI Insights to contact me about product offerings, services, events and other marketing materials. I may unsubscribe at any time. To learn more, see our Privacy Policy.
              </p>
              <button
                type="submit"
                className="w-full mt-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-transform transform hover:scale-[1.02]"
              >
                Contact Sales
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};