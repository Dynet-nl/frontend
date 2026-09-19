// Tests for the Modal presets. These guard the prop contract (open/onClose/variant):
// several callers used to pass isOpen/onCancel and the dialogs silently never opened.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal, AlertModal } from '../../components/ui';

describe('ConfirmModal', () => {
    it('renders nothing while closed', () => {
        render(<ConfirmModal open={false} onClose={jest.fn()} onConfirm={jest.fn()} message="Sure?" />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders title, message and both buttons when open', () => {
        render(
            <ConfirmModal open onClose={jest.fn()} onConfirm={jest.fn()} title="Delete City" message="Sure?" confirmText="Delete" cancelText="Keep" />
        );
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Delete City')).toBeInTheDocument();
        expect(screen.getByText('Sure?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
    });

    it('calls onConfirm and onClose from the respective buttons', () => {
        const onConfirm = jest.fn();
        const onClose = jest.fn();
        render(<ConfirmModal open onClose={onClose} onConfirm={onConfirm} message="Sure?" confirmText="Yes" cancelText="No" />);

        fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'No' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes on Escape', () => {
        const onClose = jest.fn();
        render(<ConfirmModal open onClose={onClose} onConfirm={jest.fn()} message="Sure?" />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });

    it('accepts rich content as the message', () => {
        render(<ConfirmModal open onClose={jest.fn()} onConfirm={jest.fn()} message={<textarea aria-label="reason" />} />);
        expect(screen.getByLabelText('reason')).toBeInTheDocument();
    });
});

describe('AlertModal', () => {
    it('shows the message and closes from the button', () => {
        const onClose = jest.fn();
        render(<AlertModal open onClose={onClose} title="Error" message="Failed to block building." buttonText="OK" />);
        expect(screen.getByText('Failed to block building.')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'OK' }));
        expect(onClose).toHaveBeenCalled();
    });
});
