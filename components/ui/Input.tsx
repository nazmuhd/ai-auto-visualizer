
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ElementType;
}

export const Input: React.FC<InputProps> = ({ label, error, icon: Icon, className = '', id, ...props }) => {
    const inputId = id || props.name;
    return (
        <div className="w-full">
            {label && <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className="h-5 w-5 text-slate-400" />
                    </div>
                )}
                <input
                    id={inputId}
                    className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border rounded-lg outline-none transition-all duration-200 
                        ${error 
                            ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-500' 
                            : 'border-slate-300 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white text-slate-900'
                        } 
                        disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};
