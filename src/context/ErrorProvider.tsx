// API error handling: turns an axios error into a readable Dutch message and shows it as a toast.

import React, { createContext, useContext, useCallback, ReactNode, useMemo } from 'react';
import { AxiosError } from 'axios';
import { useNotification } from './NotificationProvider';

interface ErrorContextType {
    handleApiError: (error: unknown, fallbackMessage?: string) => void;
    messageFor: (error: unknown, fallbackMessage?: string) => string;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const getErrorMessage = (error: unknown, fallbackMessage = 'Er ging iets mis.'): string => {
    if (error instanceof AxiosError) {
        const status = error.response?.status;
        const serverMessage = (error.response?.data as { message?: string } | undefined)?.message;
        if (!error.response) return 'De server reageert niet. Controleer je verbinding.';
        if (serverMessage && status !== 500) return serverMessage;
        switch (status) {
            case 400: return 'Ongeldige invoer. Controleer de velden en probeer het opnieuw.';
            case 401: return 'Je sessie is verlopen. Log opnieuw in.';
            case 403: return 'Je hebt geen rechten voor deze actie.';
            case 404: return 'Niet gevonden.';
            case 409: return serverMessage || 'Conflict: dit bestaat al.';
            case 429: return 'Te veel verzoeken. Wacht even en probeer het opnieuw.';
            case 500: case 502: case 503: case 504: return 'De server gaf een fout. Probeer het later opnieuw.';
            default: return fallbackMessage;
        }
    }
    if (error instanceof Error) return error.message || fallbackMessage;
    return fallbackMessage;
};

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { showError } = useNotification();

    const messageFor = useCallback((error: unknown, fallbackMessage?: string) => getErrorMessage(error, fallbackMessage), []);
    const handleApiError = useCallback((error: unknown, fallbackMessage?: string) => {
        showError(getErrorMessage(error, fallbackMessage));
    }, [showError]);

    const value = useMemo(() => ({ handleApiError, messageFor }), [handleApiError, messageFor]);
    return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

export const useError = (): ErrorContextType => {
    const context = useContext(ErrorContext);
    if (!context) throw new Error('useError must be used within an ErrorProvider');
    return context;
};

export default ErrorProvider;
