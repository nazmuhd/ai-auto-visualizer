import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQItem: React.FC<{ question: string; children: React.ReactNode; id?: string }> = ({ question, children, id }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div id={id} className={`border-b border-slate-200 py-5 transition-colors duration-200 ${isOpen ? 'bg-white rounded-lg px-4 -mx-4' : ''}`}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left text-lg font-medium text-slate-900 hover:text-primary-600 transition-colors">
                <span>{question}</span>
                <ChevronDown className={`flex-shrink-0 h-5 w-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-600' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 mt-4' : 'max-h-0'}`}>
                <div className="text-slate-600 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const FAQSection: React.FC = () => {
    return (
        <section id="faq" className="py-20 bg-slate-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-2">
                    <FAQItem question="Is my data secure?" id="faq-security">
                        <p>Absolutely. Your data file is processed directly in your web browser. We do not upload your full file to our servers. Only a small, anonymized sample of the data structure (column headers and a few rows) is sent to the AI for analysis. Your sensitive information never leaves your machine.</p>
                    </FAQItem>
                     <FAQItem question="Is this tool really free?">
                        <p>Yes, AI Insights is currently free to use. Our goal is to make powerful data analysis accessible to everyone. In the future, we may introduce premium plans with advanced features for enterprise teams, but the core functionality you see today will remain available in a generous free tier.</p>
                    </FAQItem>
                    <FAQItem question="What happens to my data after I close the browser?">
                        <p>Unless you explicitly save a dashboard to your account, your data is not stored anywhere. Once you close the browser tab, the data is gone. Saved dashboards are stored securely and are only accessible after you log in.</p>
                    </FAQItem>
                    <FAQItem question="Can I customize the charts?">
                        <p>Yes. The AI-generated dashboard is just a starting point. You have full control to edit chart titles and descriptions, change chart types (e.g., from a bar chart to a line chart), and apply powerful filters to drill down into your data, all from the 3-dot menu on each chart.</p>
                    </FAQItem>
                     <FAQItem question="What file types do you support?">
                        <p>We currently support the most common data formats, including CSV, Microsoft Excel (.xls and .xlsx). For the best results, we recommend using clean, tabular data where the first row contains your column headers.</p>
                    </FAQItem>
                </div>
            </div>
        </section>
    );
};
