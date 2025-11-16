import React, { useState } from 'react';
import { User, Shield, CreditCard, LogOut, Camera, Save, Key, Bell, Power } from 'lucide-react';

interface Props {
  userEmail: string;
  onLogout: () => void;
}

type AccountTab = 'profile' | 'security' | 'billing';

const TabButton: React.FC<{
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      isActive ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon size={16} className="mr-3" />
    {label}
  </button>
);

const SectionCard: React.FC<{ title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, children, footer }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        </div>
        <div className="p-6 space-y-4">
            {children}
        </div>
        {footer && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 rounded-b-2xl text-right">
                {footer}
            </div>
        )}
    </div>
);

const InputField: React.FC<{ label: string; id: string; type: string; value: string; disabled?: boolean }> = ({ label, id, type, value, disabled = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input 
            type={type} 
            id={id} 
            defaultValue={value} 
            disabled={disabled}
            className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
        />
    </div>
);

export const AccountPage: React.FC<Props> = ({ userEmail, onLogout }) => {
    const [activeTab, setActiveTab] = useState<AccountTab>('profile');

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <SectionCard
                        title="Profile Information"
                        footer={<button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium shadow-sm hover:bg-primary-700 flex items-center"><Save size={16} className="mr-2"/> Save Changes</button>}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <img src={`https://api.dicebear.com/8.x/initials/svg?seed=${userEmail}`} alt="User Avatar" className="w-20 h-20 rounded-full bg-slate-200" />
                                <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border border-slate-200 hover:bg-slate-100">
                                    <Camera size={14} className="text-slate-600" />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Full Name" id="fullName" type="text" value="Demo User" />
                            <InputField label="Email Address" id="email" type="email" value={userEmail} disabled />
                        </div>
                    </SectionCard>
                );
            case 'security':
                return (
                    <div className="space-y-6">
                         <SectionCard
                            title="Change Password"
                            footer={<button className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium shadow-sm hover:bg-black flex items-center"><Key size={16} className="mr-2"/> Update Password</button>}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="Current Password" id="currentPassword" type="password" value="********" />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="New Password" id="newPassword" type="password" value="" />
                                <InputField label="Confirm New Password" id="confirmPassword" type="password" value="" />
                            </div>
                        </SectionCard>
                        <SectionCard title="Active Sessions">
                             <p className="text-sm text-slate-500">You are currently logged in on this device. For security, you can log out from all other sessions.</p>
                             <button className="mt-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center"><Power size={16} className="mr-2"/> Log out from all other devices</button>
                        </SectionCard>
                    </div>
                );
            case 'billing':
                return (
                    <SectionCard title="Plan & Billing">
                       <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                            <p className="text-sm font-medium text-primary-700">You are on the <span className="font-bold">Pro Plan</span>.</p>
                            <p className="text-xs text-primary-600">Your plan renews on July 31, 2024.</p>
                       </div>
                        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium shadow-sm hover:bg-primary-700">Manage Subscription</button>
                    </SectionCard>
                );
            default:
                return null;
        }
    }

    return (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
                <p className="text-slate-500 mt-1">Manage your profile, security, and billing information.</p>
            </header>
            <div className="flex flex-col md:flex-row gap-8">
                <nav className="md:w-1/4 flex-shrink-0">
                    <div className="space-y-1">
                        <TabButton label="Profile" icon={User} isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                        <TabButton label="Security" icon={Shield} isActive={activeTab === 'security'} onClick={() => setActiveTab('security')} />
                        <TabButton label="Plan & Billing" icon={CreditCard} isActive={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
                        <hr className="my-2 border-slate-200" />
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50"
                        >
                            <LogOut size={16} className="mr-3" />
                            Logout
                        </button>
                    </div>
                </nav>
                <main className="flex-1">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};
