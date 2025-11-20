
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorageAdapter } from '../services/storageAdapter.ts';
import { DataRow } from '../types.ts';

/**
 * Hook to fetch the heavy raw data for a project.
 * This separates the large data payload from the main application state.
 */
export const useProjectData = (projectId: string | null, initialData?: DataRow[]) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['projectData', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            return await StorageAdapter.getProjectData(projectId);
        },
        // Only fetch for persisted projects (not 'unsaved_'). 
        // Unsaved projects will have data set via initialData or setProjectData manually.
        enabled: !!projectId && !projectId.startsWith('unsaved_'), 
        staleTime: Infinity, // Data is static per project snapshot
        gcTime: 1000 * 60 * 30, // Keep in cache for 30 mins
        initialData: initialData 
    });

    // Helper to manually update cache (e.g. after file upload or transformation in a worker)
    const setProjectData = (data: DataRow[]) => {
        if (projectId) {
            queryClient.setQueryData(['projectData', projectId], data);
        }
    };

    return {
        ...query,
        data: query.data || [],
        setProjectData
    };
};
