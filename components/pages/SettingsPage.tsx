import React, { useState } from 'react';
import { Settings, Sun, Moon, Monitor, Bell, Mail, Database, Trash2 } from 'lucide-react';

const SectionCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">{description}</p>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const ToggleSwitch: React.FC<{ label: string; description: string; enabled: boolean; setEnabled: (val: boolean) => void }> = ({ label, description, enabled, setEnabled }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div>
            <p className="font-medium text-slate-800">{label}</p>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
        <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-slate-300'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

export const SettingsPage: React.FC = () => {
    const [theme, setTheme] = useState('system');
    const [productUpdates, setProductUpdates] = useState(true);
    const [analysisComplete, setAnalysisComplete] = useState(false);

    return (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Application Settings</h1>
                <p className="text-slate-500 mt-1">Manage your global application preferences.</p>
            </header>
            <div className="space-y-8 max-w-3xl">
                <SectionCard
                    title="Appearance"
                    description="Customize how the application looks and feels."
                >
                    <div className="grid grid-cols-3 gap-3">
                        {(['light', 'dark', 'system'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTheme(t)}
                                className={`p-4 rounded-lg border-2 text-center transition-colors ${theme === t ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                            >
                                <div className="flex justify-center mb-2">
                                    {t === 'light' ? <Sun /> : t === 'dark' ? <Moon /> : <Monitor />}
                                </div>
                                <p className={`font-medium text-sm ${theme === t ? 'text-primary-800' : 'text-slate-700'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</p>
                            </button>
                        ))}
                    </div>
                </SectionCard>

                <SectionCard
                    title="Notifications"
                    description="Choose how you receive notifications from us."
                >
                    <ToggleSwitch
                        label="Product Updates"
                        description="Receive emails about new features and updates."
                        enabled={productUpdates}
                        setEnabled={setProductUpdates}
                    />
                     <ToggleSwitch
                        label="Analysis Complete"
                        description="Get a notification when a long analysis finishes."
                        enabled={analysisComplete}
                        setEnabled={setAnalysisComplete}
                    />
                </SectionCard>
                
                <SectionCard
                    title="Data & Cache"
                    description="Manage application data stored in your browser."
                >
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                         <div>
                            <p className="font-medium text-slate-800">Clear Local Project Cache</p>
                            <p className="text-xs text-slate-500">This will remove all saved projects from this browser.</p>
                        </div>
                        <button 
                            onClick={() => confirm('Are you sure you want to delete all saved projects? This action cannot be undone.') && localStorage.removeItem('ai-insights-projects')}
                            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center"
                        >
                            <Trash2 size={14} className="mr-2" />
                            Clear Cache
                        </button>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
};
