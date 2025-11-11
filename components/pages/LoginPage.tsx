import React, { useState } from 'react';
import { Sparkles, Mail, Key } from 'lucide-react';
import { Page } from '../../types.ts';

interface Props {
  onLogin: (email: string) => void;
  onNavigate: (page: Page) => void;
}

export const LoginPage: React.FC<Props> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="inline-flex items-center justify-center">
              <div className="bg-primary-600 text-white p-2 rounded-lg">
                <Sparkles size={20} className="fill-primary-400 text-white" />
              </div>
              <h1 className="ml-3 text-2xl font-bold text-slate-900">AI Insights</h1>
            </a>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 mt-1">Sign in to access your dashboard.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="password"  className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative mt-1">
                 <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-transform transform hover:scale-[1.02]"
            >
              Login
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <a href="#" onClick={(e) => {e.preventDefault(); onNavigate('signup');}} className="font-medium text-primary-600 hover:text-primary-700">
              Sign up
            </a>
          </p>
        </div>
        <div className="text-center mt-6">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}
            className="text-sm text-slate-500 hover:text-primary-600 transition-colors"
          >
            &larr; Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};