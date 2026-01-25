/**
 * React Query Provider Configuration
 * Wraps the app with QueryClientProvider for data fetching
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with default options
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache data for 30 minutes
            gcTime: 30 * 60 * 1000,
            // Retry failed requests twice
            retry: 2,
            // Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            // Don't refetch on reconnect by default
            refetchOnReconnect: false,
        },
        mutations: {
            // Retry mutations once on failure
            retry: 1,
        },
    },
});

/**
 * Query Provider Component
 * Wrap your app with this provider to enable React Query
 */
export const QueryProvider = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

// Export the query client for manual cache operations
export { queryClient };

export default QueryProvider;
