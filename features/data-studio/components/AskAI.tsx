
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DataRow, ChatMessage } from '../../../types.ts';
import { queryDataWithAI } from '../../../services/ai/queryService.ts';
import { Sparkles, Bot, User, Loader2, Send } from 'lucide-react';

interface Props {
    data: DataRow[];
}

export const AskAI: React.FC<Props> = ({ data }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'ai', content: "Hello! Ask me anything about your current data view." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
    
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
            setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm">
            <header className="px-4 py-3 border-b border-slate-100 flex-shrink-0"><h3 className="font-semibold text-slate-900 flex items-center"><Sparkles size={16} className="mr-2 text-primary-500 fill-primary-500" />Ask AI</h3></header>
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-primary-600"/></div>}
                        <div className={`p-3 rounded-2xl max-w-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-slate-200 text-slate-800 rounded-bl-lg'}`}>{msg.content}</div>
                        {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0"><User size={18} className="text-white"/></div>}
                    </div>
                ))}
                {isLoading && <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-primary-600"/></div><div className="p-3 rounded-2xl bg-slate-200"><Loader2 size={16} className="text-slate-500 animate-spin" /></div></div>}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-4 border-t border-slate-100 flex-shrink-0">
                <div className="relative">
                     <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="e.g., What is the total revenue?" className="w-full pr-12 pl-4 py-2.5 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" disabled={isLoading} />
                    <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-300"><Send size={16} /></button>
                </div>
            </footer>
        </div>
    );
};
