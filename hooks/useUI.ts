
import { useState, useEffect } from 'react';

export const useResponsiveSidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            }
        };
        // Set initial state based on width
        if (window.innerWidth >= 1024) {
            setIsSidebarOpen(true);
        }
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return [isSidebarOpen, setIsSidebarOpen] as const;
};
