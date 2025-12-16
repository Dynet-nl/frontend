// Modal component to replace window.alert and window.confirm
// Usage: <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm">Content</Modal>

import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import './Modal.css';

const Modal = ({
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
    const handleEscape = useCallback((e) => {
        if (e.key === 'Escape' && closeOnEscape) {
            onClose();
        }
    }, [closeOnEscape, onClose]);

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

    const handleOverlayClick = (e) => {
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
                            <button 
                                className="ui-modal__close" 
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}
                <div className="ui-modal__content">
                    {children}
                </div>
                {footer && (
                    <div className="ui-modal__footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

// Confirm modal preset - replaces window.confirm
const ConfirmModal = ({
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
const AlertModal = ({
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

Modal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string,
    children: PropTypes.node,
    size: PropTypes.oneOf(['small', 'medium', 'large', 'fullscreen']),
    showCloseButton: PropTypes.bool,
    closeOnOverlayClick: PropTypes.bool,
    closeOnEscape: PropTypes.bool,
    footer: PropTypes.node,
    className: PropTypes.string,
};

ConfirmModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string,
    message: PropTypes.string.isRequired,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    variant: PropTypes.oneOf(['primary', 'danger', 'success']),
    loading: PropTypes.bool,
};

AlertModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string,
    message: PropTypes.string.isRequired,
    buttonText: PropTypes.string,
    variant: PropTypes.oneOf(['primary', 'danger', 'success']),
};

export { Modal as default, ConfirmModal, AlertModal };
