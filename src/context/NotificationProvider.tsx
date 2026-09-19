// Toasts: bottom-right, 6 seconds, at most three at once; errors stay until dismissed.

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';
import Icon from '../components/ui/Icon';
import { t } from '../i18n';

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

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 6000;

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within a NotificationProvider');
    return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        const refs = timeoutRefs.current;
        return () => { Object.values(refs).forEach(clearTimeout); };
    }, []);

    const removeNotification = useCallback((id: string): void => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (timeoutRefs.current[id]) {
            clearTimeout(timeoutRefs.current[id]);
            delete timeoutRefs.current[id];
        }
    }, []);

    const addNotification = useCallback((notification: Partial<Notification> & { message: string }): string => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        const item: Notification = { id, type: 'info', duration: DEFAULT_DURATION, ...notification };
        setNotifications((prev) => [...prev, item].slice(-MAX_VISIBLE));
        if (item.duration > 0) {
            timeoutRefs.current[id] = setTimeout(() => {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
                delete timeoutRefs.current[id];
            }, item.duration);
        }
        return id;
    }, []);

    const clearAll = useCallback((): void => setNotifications([]), []);
    const showSuccess = useCallback((message: string, options: NotificationOptions = {}) => addNotification({ type: 'success', message, ...options }), [addNotification]);
    const showError = useCallback((message: string, options: NotificationOptions = {}) => addNotification({ type: 'error', message, duration: 0, ...options }), [addNotification]);
    const showWarning = useCallback((message: string, options: NotificationOptions = {}) => addNotification({ type: 'warning', message, ...options }), [addNotification]);
    const showInfo = useCallback((message: string, options: NotificationOptions = {}) => addNotification({ type: 'info', message, ...options }), [addNotification]);

    const value = useMemo<NotificationContextType>(
        () => ({ notifications, addNotification, removeNotification, clearAll, showSuccess, showError, showWarning, showInfo }),
        [notifications, addNotification, removeNotification, clearAll, showSuccess, showError, showWarning, showInfo]
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <ToastContainer />
        </NotificationContext.Provider>
    );
};

const ICONS: Record<NotificationType, string> = { success: 'check_circle', error: 'block', warning: 'warning', info: 'info' };

const ToastContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotification();
    if (notifications.length === 0) return null;
    return (
        <div className="toasts" role="region" aria-label="Meldingen">
            {notifications.map((n) => (
                <div key={n.id} className={`toast toast--${n.type}`} role={n.type === 'error' ? 'alert' : 'status'}>
                    <Icon name={ICONS[n.type]} />
                    <span>{n.message}</span>
                    <button type="button" className="toast__close" onClick={() => removeNotification(n.id)} aria-label={t('common.close')}>
                        <Icon name="close" size="dense" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NotificationContext;
