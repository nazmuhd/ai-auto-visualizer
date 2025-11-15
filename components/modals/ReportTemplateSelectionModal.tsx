import React, { useState, useEffect } from 'react';
import { ReportTemplate, ReportFormat } from '../../types.ts';
import { X, FileText, MonitorPlay, ChevronRight, CheckCircle2 } from 'lucide-react';

const SLIDE_TEMPLATES: ReportTemplate[] = [
  { id: 'mckinsey-exec-slides', format: 'slides', name: 'Executive Briefing', company: 'McKinsey', range: '3-5 Slides', description: 'Headline-driven, one key insight per slide.' },
  { id: 'bain-ops-slides', format: 'slides', name: 'Operational Review', company: 'Bain', range: '5-7 Slides', description: 'Storytelling-driven with KPI dashboards.' },
  { id: 'bcg-strat-slides', format: 'slides', name: 'Strategic Deck', company: 'BCG', range: '7-10 Slides', description: 'Scenario analysis and benchmarking visuals.' },
  { id: 'deloitte-trans-slides', format: 'slides', name: 'Transformation Deck', company: 'Deloitte/Accenture', range: '10+ Slides', description: 'Digital roadmaps with icons and phases.' },
];

const PDF_TEMPLATES: ReportTemplate[] = [
  { id: 'mckinsey-exec-pdf', format: 'pdf', name: 'Executive Report', company: 'McKinsey/BCG', range: '3 Pages', description: 'Concise summary, top charts, and recommendations.' },
  { id: 'bain-ops-pdf', format: 'pdf', name: 'Operational Report', company: 'Bain/Deloitte', range: '5 Pages', description: 'KPIs, risks, and a clear action plan.' },
  { id: 'bcg-strat-pdf', format: 'pdf', name: 'Strategic Report', company: 'BCG/Accenture', range: '7-10 Pages', description: 'Deep market analysis and implementation roadmap.' },
  { id: 'pwc-comp-pdf', format: 'pdf', name: 'Compliance Report', company: 'PwC/EY', range: '20+ Pages', description: 'Detailed documentation with heavy text and appendices.' },
];


interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
  preselectedFormat?: ReportFormat | null;
}

export const ReportTemplateSelectionModal: React.FC<Props> = ({ isOpen, onClose, onSelect, preselectedFormat }) => {
  const [step, setStep] = useState<'format' | 'template'>('format');
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat | null>(null);

  useEffect(() => {
    if (isOpen) {
        if (preselectedFormat) {
            setSelectedFormat(preselectedFormat);
            setStep('template');
        } else {
            setSelectedFormat(null);
            setStep('format');
        }
    }
  }, [isOpen, preselectedFormat]);

  if (!isOpen) return null;

  const handleFormatSelect = (format: ReportFormat) => {
    setSelectedFormat(format);
    setStep('template');
  };

  const templates = selectedFormat === 'slides' ? SLIDE_TEMPLATES : PDF_TEMPLATES;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="template-modal-title" 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] duration-200 relative flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h3 id="template-modal-title" className="text-xl font-bold text-slate-900">
            {step === 'format' ? 'Choose a Report Format' : `Select a ${selectedFormat === 'slides' ? 'Slide' : 'PDF'} Template`}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {step === 'format' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              <button onClick={() => handleFormatSelect('slides')} className="p-8 border-2 border-slate-200 rounded-xl flex flex-col items-center justify-center text-center hover:border-primary-500 hover:bg-primary-50/50 transition-all transform hover:-translate-y-1">
                <MonitorPlay size={64} className="text-primary-600 mb-4" />
                <h4 className="text-2xl font-bold text-slate-900">Slides</h4>
                <p className="text-slate-500 mt-2">For live presentations and executive briefings. (16:9 Landscape)</p>
              </button>
              <button onClick={() => handleFormatSelect('pdf')} className="p-8 border-2 border-slate-200 rounded-xl flex flex-col items-center justify-center text-center hover:border-primary-500 hover:bg-primary-50/50 transition-all transform hover:-translate-y-1">
                <FileText size={64} className="text-primary-600 mb-4" />
                <h4 className="text-2xl font-bold text-slate-900">PDF Report</h4>
                <p className="text-slate-500 mt-2">For detailed leave-behind documents and formal analysis. (A4 Portrait)</p>
              </button>
            </div>
          )}
          {step === 'template' && (
            <div>
              <button onClick={() => setStep('format')} className="text-sm font-medium text-slate-600 hover:text-primary-600 flex items-center mb-6">
                <ChevronRight size={16} className="rotate-180 mr-1" /> Back to format selection
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map(template => (
                      <button 
                          key={template.id} 
                          onClick={() => onSelect(template.id)}
                          className="relative text-left p-6 border-2 border-slate-200 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary-500 bg-white"
                      >
                          <div className="mt-4">
                              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{template.company}</p>
                              <h4 className="font-bold text-slate-800 text-lg mt-1">{template.name}</h4>
                              <p className="text-sm text-slate-500 mt-2">{template.description}</p>
                              <p className="text-xs text-primary-600 mt-4 font-bold bg-primary-50 py-1 px-2 rounded-full inline-block">{template.range}</p>
                          </div>
                      </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};