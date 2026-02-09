// Tests for NotificationProvider and useNotification hook

import React from 'react';
import { screen, waitFor, fireEvent, render } from '@testing-library/react';
import { NotificationProvider, useNotification } from '../../context/NotificationProvider';
import { renderHook } from '@testing-library/react';

// Test component that uses the notification hook
const TestComponent = () => {
    const { showSuccess, showError, showWarning, showInfo } = useNotification();

    return (
        <div>
            <button onClick={() => showSuccess('Success message')}>Show Success</button>
            <button onClick={() => showError('Error message')}>Show Error</button>
            <button onClick={() => showWarning('Warning message')}>Show Warning</button>
            <button onClick={() => showInfo('Info message')}>Show Info</button>
        </div>
    );
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
);

describe('NotificationProvider', () => {
    it('should render children', () => {
        render(
            <NotificationProvider>
                <div>Child content</div>
            </NotificationProvider>
        );

        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should show success notification', async () => {
        render(<TestComponent />, { wrapper: NotificationProvider });

        fireEvent.click(screen.getByText('Show Success'));

        await waitFor(() => {
            expect(screen.getByText('Success message')).toBeInTheDocument();
        });
    });

    it('should show error notification', async () => {
        render(<TestComponent />, { wrapper: NotificationProvider });

        fireEvent.click(screen.getByText('Show Error'));

        await waitFor(() => {
            expect(screen.getByText('Error message')).toBeInTheDocument();
        });
    });

    it('should show warning notification', async () => {
        render(<TestComponent />, { wrapper: NotificationProvider });

        fireEvent.click(screen.getByText('Show Warning'));

        await waitFor(() => {
            expect(screen.getByText('Warning message')).toBeInTheDocument();
        });
    });

    it('should show info notification', async () => {
        render(<TestComponent />, { wrapper: NotificationProvider });

        fireEvent.click(screen.getByText('Show Info'));

        await waitFor(() => {
            expect(screen.getByText('Info message')).toBeInTheDocument();
        });
    });
});

describe('useNotification hook', () => {
    it('should return notification methods', () => {
        const { result } = renderHook(() => useNotification(), { wrapper });

        expect(typeof result.current.showSuccess).toBe('function');
        expect(typeof result.current.showError).toBe('function');
        expect(typeof result.current.showWarning).toBe('function');
        expect(typeof result.current.showInfo).toBe('function');
    });

    it('should throw error when used outside provider', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => {
            renderHook(() => useNotification());
        }).toThrow();

        consoleSpy.mockRestore();
    });
});
