// Tests for ErrorBoundary component

import React from 'react';
import { screen, render } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
};

describe('ErrorBoundary', () => {
    // Suppress console.error for these tests
    const originalError = console.error;
    beforeAll(() => {
        console.error = jest.fn();
    });

    afterAll(() => {
        console.error = originalError;
    });

    it('should render children when there is no error', () => {
        render(
            <ErrorBoundary>
                <div>Child content</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should render error UI when child throws', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Er ging iets mis')).toBeInTheDocument();
    });

    it('should display generic error message', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // The ErrorBoundary shows a generic message, not the actual error
        expect(screen.getByText(/De app kon niet worden weergegeven/)).toBeInTheDocument();
    });

    it('should provide a way to recover', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Check for reload or retry buttons
        const tryAgainButton = screen.getByRole('button', { name: /opnieuw proberen/i });
        const reloadButton = screen.getByRole('button', { name: /pagina herladen/i });
        expect(tryAgainButton).toBeInTheDocument();
        expect(reloadButton).toBeInTheDocument();
    });
});
