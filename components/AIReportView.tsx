import React from 'react';
import { Project } from '../types.ts';
import { Bot, Sparkles, Loader2 } from 'lucide-react';

interface Props {
    project: Project;
    onGenerate: () => void;
}

export const AIReportView: React.FC<Props> = ({ project, onGenerate }) => {
    const status = project.aiReport?.status;

    if (status === 'generating') {
        return (
            <div className="w-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
                <Loader2 className="h-12 w-12 text-primary-500 animate-spin mb-4" />
                <h3 className="text-xl font-semibold text-slate-700">The AI Consultant is on the job...</h3>
                <p className="text-slate-500 mt-1">Analyzing insights and preparing your strategic report.</p>
            </div>
        );
    }
    
    if (status === 'complete' && project.aiReport?.content) {
        const renderMarkdown = (text: string) => {
            const lines = text.split('\n');
            let html = '';
            let inList = false;

            const closeList = () => {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
            };

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('### ')) {
                    closeList();
                    html += `<h3 class="text-xl font-bold text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-200">${trimmedLine.substring(4)}</h3>`;
                } else if (trimmedLine.startsWith('* ')) {
                    if (!inList) {
                        html += '<ul class="space-y-3 mt-4">';
                        inList = true;
                    }
                    const listItemContent = trimmedLine.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    html += `<li class="flex items-start"><span class="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 mt-2.5 mr-3 shrink-0" /><span>${listItemContent}</span></li>`;
                } else if (trimmedLine) {
                    closeList();
                    const paragraphContent = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    html += `<p class="text-slate-700 leading-relaxed mt-4">${paragraphContent}</p>`;
                }
            }

            closeList();
            return html;
        };

        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-4xl mx-auto">
                 <div className="flex items-center mb-6 text-2xl font-bold text-slate-900">
                    <Bot className="w-8 h-8 mr-3 text-primary-600" />
                    AI-Generated Consultant Report
                 </div>
                 <div 
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(project.aiReport.content) }} 
                 />
            </div>
        );
    }

    return (
        <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-slate-300">
            <div className="p-4 bg-primary-100 text-primary-600 rounded-full mb-6 inline-block">
                <Sparkles size={40} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Unlock Deeper Insights
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Go beyond the charts. Let our AI act as your personal business consultant and generate a narrative report with key findings and actionable recommendations.
            </p>
            <button 
                onClick={onGenerate}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center mx-auto"
            >
                <Bot size={16} className="mr-2" />
                Generate AI Report
            </button>
        </div>
    );
};
