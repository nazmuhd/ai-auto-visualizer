
import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, SaveStatus } from '../types.ts';

const STORAGE_KEY = 'ai-insights-projects';

export const useProjects = () => {
    const [savedProjects, setSavedProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const saveStatusTimeoutRef = useRef<number | null>(null);

    // Load projects on mount
    useEffect(() => {
        try {
            const storedProjects = localStorage.getItem(STORAGE_KEY);
            if (storedProjects) {
                const projects: Project[] = JSON.parse(storedProjects, (key, value) => {
                    if ((key === 'createdAt' || key === 'lastSaved') && typeof value === 'string') {
                        return new Date(value);
                    }
                    return value;
                });
                setSavedProjects(projects);
            }
        } catch (e) {
            console.error("Failed to load projects from local storage", e);
        }
    }, []);

    // Helper to save to LS
    const persistProjects = (projects: Project[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        } catch (e) {
            console.error("Failed to save projects to local storage", e);
        }
    };

    const createProject = useCallback((name: string, description: string) => {
        const newProject: Project = {
            id: new Date().toISOString(), 
            name, 
            description, 
            createdAt: new Date(), 
            lastSaved: new Date(),
            dataSource: { name: 'No data source', data: [] }, 
            analysis: null,
        };
        const updatedProjects = [newProject, ...savedProjects];
        setSavedProjects(updatedProjects);
        persistProjects(updatedProjects);
        setActiveProject(newProject);
        return newProject;
    }, [savedProjects]);

    const saveProject = useCallback((name: string, description: string) => {
        if (!activeProject) return;
        
        setSaveStatus('saving');
        // If it was an unsaved draft (id starts with unsaved_), generate a real ID
        const isDraft = activeProject.id.startsWith('unsaved_');
        const finalId = isDraft ? new Date().toISOString() : activeProject.id;
        
        const finalProject: Project = { 
            ...activeProject, 
            id: finalId, 
            name, 
            description, 
            createdAt: activeProject.createdAt || new Date(), 
            lastSaved: new Date() 
        };

        let updatedProjects: Project[];
        if (isDraft) {
            updatedProjects = [finalProject, ...savedProjects];
        } else {
            updatedProjects = savedProjects.map(p => p.id === finalProject.id ? finalProject : p);
        }

        setSavedProjects(updatedProjects);
        persistProjects(updatedProjects);
        setActiveProject(finalProject);
        
        setTimeout(() => {
            setSaveStatus('saved');
            if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current);
            saveStatusTimeoutRef.current = window.setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    }, [activeProject, savedProjects]);

    const manualSave = useCallback(() => {
        if (!activeProject) return;
        if (activeProject.id.startsWith('unsaved_')) {
            // Cannot manual save a draft without a name/modal interaction usually, 
            // but this method assumes the project is already established.
            // We'll treat this as updating the current active project state in memory mostly,
            // unless it's already in the list.
             console.warn("Cannot manual save a draft without full metadata. Use saveProject instead.");
             return;
        }
        saveProject(activeProject.name, activeProject.description);
    }, [activeProject, saveProject]);

    const updateActiveProject = useCallback((updater: (prev: Project) => Project) => {
        setActiveProject(prev => {
            if (!prev) return null;
            const updatedProject = updater(prev);
            
            // If we modify a saved project, mark it as unsaved in UI status
            if (!prev.id.startsWith('unsaved_')) {
                setSaveStatus('unsaved');
            }
            return updatedProject;
        });
    }, []);

    const selectProject = useCallback((projectId: string) => {
        const project = savedProjects.find(p => p.id === projectId);
        if (project) {
            setActiveProject(project);
            setSaveStatus('idle');
        }
    }, [savedProjects]);

    const deleteProject = useCallback((project: Project) => {
        const updatedProjects = savedProjects.filter(p => p.id !== project.id);
        setSavedProjects(updatedProjects);
        persistProjects(updatedProjects);
        if (activeProject?.id === project.id) {
            setActiveProject(null);
        }
    }, [savedProjects, activeProject]);

    const renameProject = useCallback((project: Project, name: string, description: string) => {
        const updatedProject = { ...project, name, description, lastSaved: new Date() };
        const updatedProjects = savedProjects.map(p => p.id === project.id ? updatedProject : p);
        setSavedProjects(updatedProjects);
        persistProjects(updatedProjects);
        if (activeProject?.id === project.id) setActiveProject(updatedProject);
    }, [savedProjects, activeProject]);
    
    const resetActiveProject = useCallback(() => {
        setActiveProject(null);
        setSaveStatus('idle');
    }, []);

    return {
        savedProjects,
        activeProject,
        saveStatus,
        setSaveStatus,
        setActiveProject, // Exposed for raw setting if needed (e.g. file upload initialization)
        updateActiveProject,
        createProject,
        saveProject,
        manualSave,
        selectProject,
        deleteProject,
        renameProject,
        resetActiveProject
    };
};
