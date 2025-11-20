
import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface PopoverProps {
    trigger: (isOpen: boolean) => ReactNode;
    content: ReactNode;
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    align?: 'left' | 'right';
    className?: string;
}

export const Popover: React.FC<PopoverProps> = ({ 
    trigger, 
    content, 
    isOpen: controlledIsOpen, 
    onOpenChange,
    align = 'right',
    className = ''
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
    
    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) {
            setInternalIsOpen(newOpen);
        }
        if (onOpenChange) {
            onOpenChange(newOpen);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                handleOpenChange(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-left" ref={containerRef}>
            <div onClick={() => handleOpenChange(!isOpen)}>
                {trigger(isOpen)}
            </div>
            
            {isOpen && (
                <div 
                    className={`absolute z-50 mt-2 w-56 rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-100 ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} ${className}`}
                >
                    <div className="py-1">
                        {content}
                    </div>
                </div>
            )}
        </div>
    );
};
