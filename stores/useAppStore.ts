import { create } from 'zustand';
import { temporal } from 'zundo';
import { Project, ProjectMetadata, SaveStatus } from '../types.ts';
import { StorageAdapter } from '../services/storageAdapter.ts';

interface AppState {
    // Project List State
    projects: ProjectMetadata[];
    refreshProjects: () => void;
    deleteProject: (id: string) => void;

    // Active Workspace State
    activeProject: Project | null;
    activeProjectId: string | null;
    saveStatus: SaveStatus;
    
    // Actions
    setActiveProject: (project: Project | null) => void;
    loadProject: (id: string) => Promise<void>;
    createProject: (name: string, description: string) => Project;
    saveActiveProject: (name?: string, description?: string) => Promise<void>;
    updateActiveProject: (updater: (prev: Project) => Project) => void;
    resetActiveProject: () => void;
    setSaveStatus: (status: SaveStatus) => void;
}

// Initialize migration on module load (fire and forget)
StorageAdapter.migrateIfNeeded();

// Minimal UUID generator for store usage if uuid package isn't imported in this file
function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

export const useAppStore = create<AppState>()(
    temporal(
        (set, get) => ({
            projects: StorageAdapter.getProjectList(),
            activeProject: null,
            activeProjectId: null,
            saveStatus: 'idle',

            refreshProjects: () => {
                set({ projects: StorageAdapter.getProjectList() });
            },

            deleteProject: async (id: string) => {
                await StorageAdapter.deleteProject(id);
                set(state => ({
                    projects: state.projects.filter(p => p.id !== id),
                    activeProject: state.activeProject?.id === id ? null : state.activeProject,
                    activeProjectId: state.activeProjectId === id ? null : state.activeProjectId
                }));
            },

            setActiveProject: (project) => {
                set({ 
                    activeProject: project,
                    activeProjectId: project?.id || null,
                    saveStatus: project ? (project.id.startsWith('unsaved_') ? 'unsaved' : 'idle') : 'idle'
                });
            },

            loadProject: async (id: string) => {
                // Optimistically set ID
                set({ activeProjectId: id, saveStatus: 'idle' });
                
                const project = await StorageAdapter.loadProject(id);
                if (project) {
                    set({ 
                        activeProject: project, 
                        activeProjectId: id,
                        saveStatus: 'idle'
                    });
                }
            },

            createProject: (name, description) => {
                const newProject: Project = {
                    id: `unsaved_${Date.now()}`,
                    name,
                    description,
                    createdAt: new Date(),
                    lastSaved: new Date(),
                    dataSource: { name: 'No data source', data: [] },
                    analysis: null,
                };
                set({ 
                    activeProject: newProject,
                    activeProjectId: newProject.id,
                    saveStatus: 'unsaved' 
                });
                return newProject;
            },

            saveActiveProject: async (name, description) => {
                const { activeProject, refreshProjects } = get();
                if (!activeProject) return;

                set({ saveStatus: 'saving' });

                const isDraft = activeProject.id.startsWith('unsaved_');
                const finalId = isDraft ? uuidv4() : activeProject.id;

                const finalProject: Project = {
                    ...activeProject,
                    id: finalId,
                    name: name || activeProject.name,
                    description: description !== undefined ? description : activeProject.description,
                    lastSaved: new Date()
                };

                await StorageAdapter.saveProject(finalProject);
                
                set({ 
                    activeProject: finalProject,
                    activeProjectId: finalId,
                    saveStatus: 'saved' 
                });
                refreshProjects();
                
                setTimeout(() => set({ saveStatus: 'idle' }), 2000);
            },

            updateActiveProject: (updater) => {
                set(state => {
                    if (!state.activeProject) return {};
                    const updated = updater(state.activeProject);
                    // Don't mark as unsaved if it's a draft, it's implied.
                    const newStatus = updated.id.startsWith('unsaved_') ? 'unsaved' : 'unsaved';
                    return { activeProject: updated, saveStatus: newStatus };
                });
            },

            resetActiveProject: () => {
                set({ activeProject: null, activeProjectId: null, saveStatus: 'idle' });
            },

            setSaveStatus: (status) => set({ saveStatus: status }),
        }),
        {
            // Only track changes to the activeProject
            partialize: (state) => ({ activeProject: state.activeProject }),
            limit: 20, 
            equality: (a, b) => JSON.stringify(a) === JSON.stringify(b) 
        }
    )
);