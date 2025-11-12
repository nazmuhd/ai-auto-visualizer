import React from 'react';
import { X, Mail, MessageSquare, Send } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would handle form submission here
    alert("Thank you for your message! We'll be in touch soon.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm duration-200" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-md duration-200 relative" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center">
          <h3 id="contact-modal-title" className="text-xl font-bold text-slate-900">Get in Touch</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="contact-email" className="text-sm font-medium text-slate-700">Your Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input id="contact-email" type="email" placeholder="you@example.com" className="w-full pl-10 pr-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
              </div>
            </div>
             <div>
              <label htmlFor="contact-message" className="text-sm font-medium text-slate-700">Message</label>
              <div className="relative mt-1">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <textarea id="contact-message" placeholder="How can we help you?" className="w-full pl-10 pr-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none h-32" required />
              </div>
            </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm flex items-center justify-center">
              <Send size={16} className="mr-2" />
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};