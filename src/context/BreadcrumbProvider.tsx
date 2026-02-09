// Context provider for managing breadcrumb navigation state across the application.

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BreadcrumbItem } from '../components/Breadcrumb';

interface BreadcrumbContextType {
    items: BreadcrumbItem[];
    setItems: (items: BreadcrumbItem[]) => void;
    pushItem: (item: BreadcrumbItem) => void;
    popItem: () => void;
    clearItems: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

interface BreadcrumbProviderProps {
    children: ReactNode;
}

export const BreadcrumbProvider: React.FC<BreadcrumbProviderProps> = ({ children }) => {
    const [items, setItemsState] = useState<BreadcrumbItem[]>([]);

    const setItems = useCallback((newItems: BreadcrumbItem[]) => {
        setItemsState(newItems);
    }, []);

    const pushItem = useCallback((item: BreadcrumbItem) => {
        setItemsState(prev => [...prev, item]);
    }, []);

    const popItem = useCallback(() => {
        setItemsState(prev => prev.slice(0, -1));
    }, []);

    const clearItems = useCallback(() => {
        setItemsState([]);
    }, []);

    return (
        <BreadcrumbContext.Provider value={{ items, setItems, pushItem, popItem, clearItems }}>
            {children}
        </BreadcrumbContext.Provider>
    );
};

export const useBreadcrumb = (): BreadcrumbContextType => {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
    }
    return context;
};

export default BreadcrumbProvider;
