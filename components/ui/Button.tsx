
import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    icon?: React.ElementType;
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    icon: Icon, 
    className = '', 
    disabled,
    ...props 
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm focus:ring-primary-500",
        secondary: "bg-slate-800 text-white hover:bg-slate-900 shadow-sm focus:ring-slate-500",
        outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    return (
        <button 
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isLoading && Icon && <Icon className={`mr-2 ${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />}
            {children}
        </button>
    );
};
