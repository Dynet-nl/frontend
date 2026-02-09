// Global error handling context for user-friendly error messages across the application.

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AxiosError } from 'axios';

interface ErrorState {
    message: string;
    type: 'error' | 'warning' | 'info';
    id: string;
}

interface ErrorContextType {
    errors: ErrorState[];
    addError: (message: string, type?: 'error' | 'warning' | 'info') => void;
    removeError: (id: string) => void;
    clearErrors: () => void;
    handleApiError: (error: unknown, fallbackMessage?: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
    children: ReactNode;
}

// Helper to extract user-friendly message from API errors
const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
    if (error instanceof AxiosError) {
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;

        if (serverMessage) {
            return serverMessage;
        }

        switch (status) {
            case 400:
                return 'Invalid request. Please check your input and try again.';
            case 401:
                return 'Your session has expired. Please log in again.';
            case 403:
                return 'You do not have permission to perform this action.';
            case 404:
                return 'The requested resource was not found.';
            case 409:
                return 'A conflict occurred. The resource may already exist.';
            case 422:
                return 'The provided data is invalid. Please check and try again.';
            case 429:
                return 'Too many requests. Please wait a moment and try again.';
            case 500:
                return 'A server error occurred. Please try again later.';
            case 502:
            case 503:
            case 504:
                return 'The server is temporarily unavailable. Please try again later.';
            default:
                if (!error.response) {
                    return 'Unable to connect to the server. Please check your internet connection.';
                }
                return fallbackMessage;
        }
    }

    if (error instanceof Error) {
        return error.message || fallbackMessage;
    }

    return fallbackMessage;
};

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
    const [errors, setErrors] = useState<ErrorState[]>([]);

    const addError = useCallback((message: string, type: 'error' | 'warning' | 'info' = 'error') => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setErrors(prev => [...prev, { message, type, id }]);

        // Auto-remove after 8 seconds
        setTimeout(() => {
            setErrors(prev => prev.filter(e => e.id !== id));
        }, 8000);
    }, []);

    const removeError = useCallback((id: string) => {
        setErrors(prev => prev.filter(e => e.id !== id));
    }, []);

    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    const handleApiError = useCallback((error: unknown, fallbackMessage = 'An unexpected error occurred.') => {
        const message = getErrorMessage(error, fallbackMessage);
        addError(message, 'error');
    }, [addError]);

    return (
        <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors, handleApiError }}>
            {children}
        </ErrorContext.Provider>
    );
};

export const useError = (): ErrorContextType => {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
};

export default ErrorProvider;
