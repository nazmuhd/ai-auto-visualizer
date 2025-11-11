import React from 'react';
import { LogIn, Sparkles, BarChart3, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export const LandingPage: React.FC<Props> = ({ onLogin }) => {
  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-primary-600 text-white p-2 rounded-lg">
                <Sparkles size={20} className="fill-primary-400 text-white" />
              </div>
              <h1 className="ml-3 text-lg font-bold text-slate-900">AI Insights</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={onLogin}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
              >
                <LogIn size={16} className="mr-2" />
                Login / Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <section className="text-center py-16">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl md:text-6xl mb-4">
              Go from Spreadsheet to <span className="text-primary-600">Insight</span> in Seconds.
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-slate-600">
              Stop guessing. Upload your raw data and let our AI automatically discover patterns, generate stunning visualizations, and deliver actionable summaries.
            </p>
            <div className="mt-8">
              <button
                onClick={onLogin}
                className="px-8 py-3 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-lg transform hover:scale-105 transition-all"
              >
                Start Analyzing for Free
              </button>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">A Smarter, Faster Way to Understand Your Data</h2>
              <p className="mt-2 text-slate-500">Our platform handles the heavy lifting, so you can focus on what matters.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="mx-auto w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl mb-4">
                  <Zap size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Instant Analysis</h3>
                <p className="text-slate-500 mt-2">
                  No more manual chart building. Our AI identifies key metrics and generates a complete dashboard tailored to your dataset.
                </p>
              </div>
              <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="mx-auto w-12 h-12 flex items-center justify-center bg-purple-100 text-purple-600 rounded-xl mb-4">
                  <BarChart3 size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Interactive Visuals</h3>
                <p className="text-slate-500 mt-2">
                  Explore your data with interactive charts. Filter, drill down, and export your findings with just a few clicks.
                </p>
              </div>
              <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="mx-auto w-12 h-12 flex items-center justify-center bg-green-100 text-green-600 rounded-xl mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Private & Secure</h3>
                <p className="text-slate-500 mt-2">
                  Your data is processed securely in your browser. We only send a small, anonymized sample for analysis.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} AI Insights. All rights reserved.</p>
          </div>
      </footer>
    </div>
  );
};
