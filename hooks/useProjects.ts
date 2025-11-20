
import { useCallback, useEffect } from 'react';
import { Project } from '../types.ts';
import { useAppStore } from '../stores/useAppStore.ts';

export const useProjects = () => {
    const projects = useAppStore(state => state.projects); // Now returns ProjectMetadata[] but Dashboard expects Project[] type compatible interface for display
    const activeProject = useAppStore(state => state.activeProject);
    const saveStatus = useAppStore(state => state.saveStatus);
    
    const storeCreateProject = useAppStore(state => state.createProject);
    const storeSaveProject = useAppStore(state => state.saveActiveProject);
    const storeLoadProject = useAppStore(state => state.loadProject);
    const storeDeleteProject = useAppStore(state => state.deleteProject);
    const storeUpdateActive = useAppStore(state => state.updateActiveProject);
    const storeReset = useAppStore(state => state.resetActiveProject);
    const storeSetActive = useAppStore(state => state.setActiveProject);
    const setSaveStatus = useAppStore(state => state.setSaveStatus);

    // Access Temporal Store for Undo/Redo
    const { undo, redo, clear, past, future } = useAppStore.temporal.getState();
    
    // Subscribe to temporal changes to trigger re-renders when history changes if needed
    // For now, we just expose the functions.

    // Clear history when project changes
    useEffect(() => {
        clear();
    }, [activeProject?.id, clear]);

    // Mapping new store actions to old hook interface for compatibility
    
    const createProject = useCallback((name: string, description: string) => {
        return storeCreateProject(name, description);
    }, [storeCreateProject]);

    const saveProject = useCallback((name: string, description: string) => {
        storeSaveProject(name, description);
    }, [storeSaveProject]);

    const manualSave = useCallback(() => {
        storeSaveProject();
    }, [storeSaveProject]);

    const updateActiveProject = useCallback((updater: (prev: Project) => Project) => {
        storeUpdateActive(updater);
    }, [storeUpdateActive]);

    const selectProject = useCallback((projectId: string) => {
        storeLoadProject(projectId);
    }, [storeLoadProject]);

    // The sidebar expects a Project object, but metadata is sufficient for it.
    // We cast metadata to Project type for now since Project interface is superset of Metadata
    const deleteProject = useCallback((project: Project) => {
        storeDeleteProject(project.id);
    }, [storeDeleteProject]);

    const renameProject = useCallback((project: Project, name: string, description: string) => {
        // If we are renaming the active project
        if (activeProject?.id === project.id) {
            storeUpdateActive(p => ({ ...p, name, description }));
            storeSaveProject(name, description);
        } else {
            // Renaming a project in the list that isn't open.
            // We need to load, update, save.
            // This is a bit heavy but correct for keeping consistency.
            // Ideally backend handles this. For local:
            // TODO: Optimization in Phase 2 for metadata-only updates
            const fullProject = useAppStore.getState().loadProject(project.id); // This sets it active side effect? 
            // Ideally we add a specific rename action to store that handles metadata only if possible
            // For now, let's just rely on opening it if the user renames it.
            storeLoadProject(project.id);
            setTimeout(() => {
                 storeSaveProject(name, description);
            }, 100);
        }
    }, [activeProject, storeUpdateActive, storeSaveProject, storeLoadProject]);

    return {
        savedProjects: projects as any as Project[], // Type casting for compat. Sidebar only reads metadata fields.
        activeProject,
        saveStatus,
        setSaveStatus,
        setActiveProject: storeSetActive,
        updateActiveProject,
        createProject,
        saveProject,
        manualSave,
        selectProject,
        deleteProject,
        renameProject,
        resetActiveProject: storeReset,
        // New Undo/Redo capabilities
        undo,
        redo,
        canUndo: useAppStore.temporal.getState().past.length > 0,
        canRedo: useAppStore.temporal.getState().future.length > 0
    };
};
