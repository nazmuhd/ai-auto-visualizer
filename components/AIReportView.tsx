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
        // A simple markdown renderer using regex
        const renderMarkdown = (text: string) => {
            let html = text;
            // Headers
            html = html.replace(/### (.*?)\n/g, '<h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h3>');
            // Bold text with asterisks
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Bullet points
            html = html.replace(/^\* (.*?)$/gm, '<li class="flex items-start"><span class="inline-block w-1.5 h-1.5 rounded-full bg-primary-400 mt-2.5 mr-3 shrink-0" /><span>$1</span></li>');
            html = html.replace(/<\/li>\n<li/g, '</li><li'); // Fix spacing
            return `<ul class="space-y-3">${html}</ul>`.replace(/<\/ul><ul/g, '');
        };

        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-4xl mx-auto">
                 <div className="flex items-center mb-6 text-2xl font-bold text-slate-900">
                    <Bot className="w-8 h-8 mr-3 text-primary-600" />
                    AI-Generated Consultant Report
                 </div>
                 <div 
                    className="prose prose-slate max-w-none prose-h3:border-b prose-h3:border-slate-200 prose-h3:pb-2" 
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