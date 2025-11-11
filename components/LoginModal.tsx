import React, { useState } from 'react';
import { X, Mail, Sparkles } from 'lucide-react';

interface Props {
  onClose: () => void;
  onLogin: (email: string) => void;
}

export const LoginModal: React.FC<Props> = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onLogin(email);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 relative" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center bg-primary-100 text-primary-600 rounded-full mb-4">
                <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Welcome Back</h3>
            <p className="text-slate-500 mt-1">Enter your email to access your dashboard.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          <div>
            <label htmlFor="email-input" className="sr-only">Email</label>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3 py-2.5 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                    autoFocus
                />
            </div>
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-transform transform hover:scale-[1.02]"
          >
            Continue
          </button>
        </form>
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">No password needed. We're keeping it simple for now.</p>
        </div>
      </div>
    </div>
  );
};
