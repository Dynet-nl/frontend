// Dialogs. Props: open / onClose / variant (kept as the single contract for the whole app).

import React, { useEffect, useCallback, ReactNode, useRef } from 'react';
import Button, { ButtonVariant, IconButton } from './Button';
import { t } from '../../i18n';

type ModalSize = 'small' | 'medium' | 'large';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: ReactNode;
    subtitle?: ReactNode;
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
    subtitle,
    children,
    size = 'small',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    footer,
    className = '',
}) => {
    const panelRef = useRef<HTMLDivElement>(null);

    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeOnEscape) onClose();
        },
        [closeOnEscape, onClose]
    );

    useEffect(() => {
        if (!open) return undefined;
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
        // Move focus into the dialog
        const first = panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button:not(.dialog__close button)');
        first?.focus();
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [open, handleEscape]);

    if (!open) return null;

    return (
        <div
            className="dialog-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && closeOnOverlayClick) onClose();
            }}
        >
            <div ref={panelRef} className={`dialog ${size === 'medium' ? 'dialog--md' : size === 'large' ? 'dialog--lg' : ''} ${className}`.trim()} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
                {(title || showCloseButton) && (
                    <div className="dialog__header">
                        <div>
                            {title && <h2 className="dialog__title">{title}</h2>}
                            {subtitle && <div className="dialog__subtitle">{subtitle}</div>}
                        </div>
                        {showCloseButton && (
                            <div className="dialog__close">
                                <IconButton icon="close" label={t('common.close')} onClick={onClose} />
                            </div>
                        )}
                    </div>
                )}
                <div className="dialog__body">{children}</div>
                {footer && <div className="dialog__footer">{footer}</div>}
            </div>
        </div>
    );
};

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: ButtonVariant;
    loading?: boolean;
    confirmDisabled?: boolean;
    size?: ModalSize;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    variant = 'danger',
    loading = false,
    confirmDisabled = false,
    size = 'small',
}) => (
    <Modal
        open={open}
        onClose={onClose}
        title={title ?? t('common.confirm')}
        size={size}
        footer={
            <>
                <Button variant="secondary" onClick={onClose} disabled={loading}>
                    {cancelText ?? t('common.cancel')}
                </Button>
                <Button variant={variant === 'danger' ? 'danger' : variant} onClick={onConfirm} loading={loading} disabled={confirmDisabled}>
                    {confirmText ?? t('common.confirm')}
                </Button>
            </>
        }
    >
        {typeof message === 'string' ? <p>{message}</p> : message}
    </Modal>
);

interface AlertModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    message: ReactNode;
    buttonText?: string;
    variant?: ButtonVariant;
}

const AlertModal: React.FC<AlertModalProps> = ({ open, onClose, title, message, buttonText, variant = 'primary' }) => (
    <Modal
        open={open}
        onClose={onClose}
        title={title}
        size="small"
        footer={
            <Button variant={variant} onClick={onClose}>
                {buttonText ?? t('common.close')}
            </Button>
        }
    >
        {typeof message === 'string' ? <p>{message}</p> : message}
    </Modal>
);

export { Modal as default, ConfirmModal, AlertModal };
