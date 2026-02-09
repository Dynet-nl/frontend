// Theme context provider for managing light/dark mode throughout the application

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
    theme: Theme;
}

interface ThemeProviderProps {
    children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        // Initialize from localStorage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    const isInitialMount = useRef<boolean>(true);

    // Apply theme to document root
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');

        // Only save to localStorage after initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = (): void => {
        setIsDarkMode((prev) => !prev);
    };

    const value = useMemo<ThemeContextType>(
        () => ({
            isDarkMode,
            toggleTheme,
            theme: isDarkMode ? 'dark' : 'light',
        }),
        [isDarkMode]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
