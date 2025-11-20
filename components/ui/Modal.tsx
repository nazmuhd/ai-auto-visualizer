
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md', className = '' }) => {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw] h-[90vh]'
    };

    const modalContent = (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => e.target === overlayRef.current && onClose()}
            ref={overlayRef}
        >
            <div 
                role="dialog" 
                aria-modal="true" 
                className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} flex flex-col relative animate-in zoom-in-95 duration-200 ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="p-6 pb-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                        <div className="text-xl font-bold text-slate-900">{title}</div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                )}
                {!title && (
                     <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors z-10">
                        <X size={20} />
                    </button>
                )}
                
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {footer && (
                    <div className="p-6 pt-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end space-x-3 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
