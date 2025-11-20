
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data in this app is static per session (user upload).
            // Once AI analyzes it, the result is valid forever for that dataset snapshot.
            staleTime: Infinity,
            gcTime: 1000 * 60 * 60, // Garbage collect after 1 hour
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
