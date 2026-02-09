// React context provider for managing global notification system with toast messages.

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';
import { UI_CONFIG } from '../utils/constants';

// Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration: number;
}

export interface NotificationOptions {
    duration?: number;
}

export interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Partial<Notification> & { message: string }) => string;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    showSuccess: (message: string, options?: NotificationOptions) => string;
    showError: (message: string, options?: NotificationOptions) => string;
    showWarning: (message: string, options?: NotificationOptions) => string;
    showInfo: (message: string, options?: NotificationOptions) => string;
}

interface NotificationProviderProps {
    children: ReactNode;
}

interface NotificationItemProps {
    notification: Notification;
    onClose: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // Cleanup timeouts on unmount
    useEffect(() => {
        const refs = timeoutRefs.current;
        return () => {
            Object.values(refs).forEach(clearTimeout);
        };
    }, []);

    const removeNotification = useCallback((id: string): void => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        if (timeoutRefs.current[id]) {
            clearTimeout(timeoutRefs.current[id]);
            delete timeoutRefs.current[id];
        }
    }, []);

    const addNotification = useCallback((notification: Partial<Notification> & { message: string }): string => {
        const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
        const newNotification: Notification = {
            id,
            type: 'info',
            duration: UI_CONFIG.TOAST_DURATION,
            ...notification
        };
        setNotifications(prev => [...prev, newNotification]);
        if (newNotification.duration > 0) {
            timeoutRefs.current[id] = setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
                delete timeoutRefs.current[id];
            }, newNotification.duration);
        }
        return id;
    }, []);

    const clearAll = useCallback((): void => {
        setNotifications([]);
    }, []);

    const showSuccess = useCallback((message: string, options: NotificationOptions = {}): string => {
        return addNotification({
            type: 'success',
            message,
            ...options
        });
    }, [addNotification]);

    const showError = useCallback((message: string, options: NotificationOptions = {}): string => {
        return addNotification({
            type: 'error',
            message,
            duration: 5000,
            ...options
        });
    }, [addNotification]);

    const showWarning = useCallback((message: string, options: NotificationOptions = {}): string => {
        return addNotification({
            type: 'warning',
            message,
            duration: 4000,
            ...options
        });
    }, [addNotification]);

    const showInfo = useCallback((message: string, options: NotificationOptions = {}): string => {
        return addNotification({
            type: 'info',
            message,
            ...options
        });
    }, [addNotification]);

    const value = useMemo<NotificationContextType>(() => ({
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        showSuccess,
        showError,
        showWarning,
        showInfo
    }), [notifications, addNotification, removeNotification, clearAll, showSuccess, showError, showWarning, showInfo]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
};

const NotificationContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotification();
    if (notifications.length === 0) return null;
    return (
        <div className="notification-container">
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
    const getIcon = (): string => {
        switch (notification.type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    };

    return (
        <div className={`notification notification-${notification.type}`}>
            <div className="notification-content">
                <span className="notification-icon">{getIcon()}</span>
                <span className="notification-message">{notification.message}</span>
            </div>
            <button
                className="notification-close"
                onClick={onClose}
                aria-label="Close notification"
            >
                ✕
            </button>
        </div>
    );
};

export default NotificationContext;
