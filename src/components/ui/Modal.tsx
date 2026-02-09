// Modal component to replace window.alert and window.confirm
// Usage: <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm">Content</Modal>

import React, { useEffect, useCallback, ReactNode } from 'react';
import Button from './Button';
import './Modal.css';

type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';
type ButtonVariant = 'primary' | 'danger' | 'success';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children?: ReactNode;
    size?: ModalSize;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    footer?: ReactNode;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({
    open,
    onClose,
    title,
    children,
    size = 'medium',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    footer,
    className = '',
}) => {
    // Handle escape key
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeOnEscape) {
                onClose();
            }
        },
        [closeOnEscape, onClose]
    );

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [open, handleEscape]);

    if (!open) return null;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && closeOnOverlayClick) {
            onClose();
        }
    };

    return (
        <div className="ui-modal__overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
            <div className={`ui-modal ui-modal--${size} ${className}`}>
                {(title || showCloseButton) && (
                    <div className="ui-modal__header">
                        {title && <h2 className="ui-modal__title">{title}</h2>}
                        {showCloseButton && (
                            <button className="ui-modal__close" onClick={onClose} aria-label="Close modal">
                                ✕
                            </button>
                        )}
                    </div>
                )}
                <div className="ui-modal__content">{children}</div>
                {footer && <div className="ui-modal__footer">{footer}</div>}
            </div>
        </div>
    );
};

// Confirm modal preset - replaces window.confirm
interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: ButtonVariant;
    loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false,
}) => {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            size="small"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button variant={variant} onClick={onConfirm} loading={loading}>
                        {confirmText}
                    </Button>
                </>
            }
        >
            <p className="ui-modal__message">{message}</p>
        </Modal>
    );
};

// Alert modal preset - replaces window.alert
interface AlertModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    buttonText?: string;
    variant?: ButtonVariant;
}

const AlertModal: React.FC<AlertModalProps> = ({
    open,
    onClose,
    title = 'Alert',
    message,
    buttonText = 'OK',
    variant = 'primary',
}) => {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            size="small"
            footer={
                <Button variant={variant} onClick={onClose}>
                    {buttonText}
                </Button>
            }
        >
            <p className="ui-modal__message">{message}</p>
        </Modal>
    );
};

export { Modal as default, ConfirmModal, AlertModal };
