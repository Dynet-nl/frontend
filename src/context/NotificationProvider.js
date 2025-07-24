import React, { createContext, useContext, useState, useCallback } from 'react';
import { UI_CONFIG } from '../utils/constants';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((notification) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const newNotification = {
            id,
            type: 'info',
            duration: UI_CONFIG.TOAST_DURATION,
            ...notification
        };

        setNotifications(prev => [...prev, newNotification]);

        if (newNotification.duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, newNotification.duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const showSuccess = useCallback((message, options = {}) => {
        return addNotification({
            type: 'success',
            message,
            ...options
        });
    }, [addNotification]);

    const showError = useCallback((message, options = {}) => {
        return addNotification({
            type: 'error',
            message,
            duration: 5000, // Longer duration for errors
            ...options
        });
    }, [addNotification]);

    const showWarning = useCallback((message, options = {}) => {
        return addNotification({
            type: 'warning',
            message,
            duration: 4000,
            ...options
        });
    }, [addNotification]);

    const showInfo = useCallback((message, options = {}) => {
        return addNotification({
            type: 'info',
            message,
            ...options
        });
    }, [addNotification]);

    const value = {
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
};

const NotificationContainer = () => {
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

const NotificationItem = ({ notification, onClose }) => {
    const getIcon = () => {
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
