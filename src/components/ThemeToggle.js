// Theme toggle component for switching between light and dark mode

import React from 'react';
import { useTheme } from '../context/ThemeProvider';
import '../styles/theme-toggle.css';

const ThemeToggle = () => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        >
            <div className="toggle-track">
                <div className="toggle-thumb">
                    <span className="toggle-icon">
                        {isDarkMode ? '🌙' : '☀️'}
                    </span>
                </div>
            </div>
        </button>
    );
};

export default ThemeToggle;