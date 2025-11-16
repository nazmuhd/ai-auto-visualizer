import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Project, DataRow, ChatMessage } from '../types.ts';
import { ChevronLeft, ChevronRight, Sparkles, Send, Loader2, User, Bot } from 'lucide-react';
import { queryDataWithAI } from '../services/geminiService.ts';

interface Props {
  project: Project;
  onProjectUpdate: (updater: (prev: Project) => Project) => void;
}

const ROWS_PER_PAGE = 25;

const DataTable: React.FC<{ data: DataRow[] }> = ({ data }) => {
    const [page, setPage] = useState(0);
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    
    const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
    const startIdx = page * ROWS_PER_PAGE;
    const previewRows = data.slice(startIdx, startIdx + ROWS_PER_PAGE);

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                <h3 className="font-semibold text-slate-900">Source Data</h3>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <span>
                        {startIdx + 1}-{Math.min(startIdx + ROWS_PER_PAGE, data.length)} of {data.length}
                    </span>
                    <div className="flex items-center space-x-1">
                        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-50">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-50">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
             <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            {headers.map((h) => <th key={h} className="px-4 py-2.5 font-medium text-slate-600 uppercase tracking-wider text-xs whitespace-nowrap">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {previewRows.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                {headers.map((h) => (
                                    <td key={`${i}-${h}`} className="px-4 py-3 text-slate-600 whitespace-nowrap max-w-xs truncate" title={String(row[h])}>
                                        {String(row[h] || '').trim() ? String(row[h]) : <em className="text-slate-400">null</em>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AskAI: React.FC<{ data: DataRow[] }> = ({ data }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'ai', content: "Hello! Ask me anything about your data." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    const sampleData = useMemo(() => {
        if (data.length <= 50) return data;
        const head = data.slice(0, 25);
        const tail = data.slice(data.length - 25);
        return [...head, ...tail];
    }, [data]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await queryDataWithAI(sampleData, input);
            const aiMessage: ChatMessage = { role: 'ai', content: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = { role: 'ai', content: "Sorry, I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
        const isUser = message.role === 'user';
        return (
            <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
                 {!isUser && <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-primary-600"/></div>}
                <div className={`p-3 rounded-2xl max-w-sm whitespace-pre-wrap ${isUser ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-slate-200 text-slate-800 rounded-bl-lg'}`}>
                    {message.content}
                </div>
                 {isUser && <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0"><User size={18} className="text-white"/></div>}
            </div>
        )
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm">
            <header className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
                <h3 className="font-semibold text-slate-900 flex items-center">
                    <Sparkles size={16} className="mr-2 text-primary-500 fill-primary-500" />
                    Ask AI
                </h3>
            </header>
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-primary-600"/></div>
                        <div className="p-3 rounded-2xl bg-slate-200">
                             <Loader2 size={16} className="text-slate-500 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-4 border-t border-slate-100 flex-shrink-0">
                <div className="relative">
                     <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="e.g., What is the total revenue?"
                        className="w-full pr-12 pl-4 py-2.5 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        disabled={isLoading}
                    />
                    <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-300">
                        <Send size={16} />
                    </button>
                </div>
            </footer>
        </div>
    );
};


export const DataStudio: React.FC<Props> = ({ project, onProjectUpdate }) => {
    const data = project.dataSource.data;
    
    return (
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-full min-h-0">
                 <DataTable data={data} />
            </div>
            <div className="lg:col-span-1 h-full min-h-0">
                 <AskAI data={data} />
            </div>
        </div>
    );
};

export default DataStudio;
