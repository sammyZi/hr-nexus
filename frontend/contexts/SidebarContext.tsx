import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
    isCompact: boolean;
    setIsCompact: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
    const [isCompact, setIsCompactState] = useState(false);

    // Load sidebar state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem('sidebar_compact');
        if (savedState !== null) {
            setIsCompactState(savedState === 'true');
        }
    }, []);

    // Save sidebar state to localStorage whenever it changes
    const setIsCompact = (value: boolean) => {
        setIsCompactState(value);
        localStorage.setItem('sidebar_compact', String(value));
    };

    return (
        <SidebarContext.Provider value={{ isCompact, setIsCompact }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebarContext = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebarContext must be used within SidebarProvider');
    }
    return context;
};
