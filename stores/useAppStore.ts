
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

// Initialize migration on module load
StorageAdapter.migrateIfNeeded();

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
                set({ activeProjectId: id, saveStatus: 'idle' });
                
                // OPTIMIZATION: Pass 'false' to skip loading the heavy data array into the store.
                // Data is fetched separately by the UI components via React Query.
                const project = await StorageAdapter.loadProject(id, false);
                
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

                // Prepare the project object. Note: dataSource.data in activeProject 
                // might be empty if loaded from store, BUT if it was just processed/imported, 
                // it needs to be retrieved.
                // Ideally, the Component calls StorageAdapter.saveProject directly with the full data,
                // OR we ensure the Store has the data momentarily.
                // Given our architecture, the 'activeProject' in the store is LIGHTWEIGHT.
                // We rely on the fact that StorageAdapter.saveProject is called via the Dashboard 
                // which has access to the full data (merged).
                // Wait - the Dashboard calls store.saveActiveProject(). 
                // The store doesn't have the data!
                // Correction: For this architecture to work, the SAVE action must be passed the full data
                // OR the Dashboard calls StorageAdapter directly.
                // In `Dashboard.tsx` we implemented `onManualSave` to handle this logic (injecting data).
                // However, to be safe, let's assume `activeProject` here might hold the data temporarily 
                // if it was updated via `updateActiveProject` with data.
                
                const finalProject: Project = {
                    ...activeProject,
                    id: finalId,
                    name: name || activeProject.name,
                    description: description !== undefined ? description : activeProject.description,
                    lastSaved: new Date()
                };

                await StorageAdapter.saveProject(finalProject);
                
                // After saving, we update the store but explicitly CLEAR the data array 
                // to free up memory, as it is now persisted in IndexedDB.
                set({ 
                    activeProject: { ...finalProject, dataSource: { ...finalProject.dataSource, data: [] } },
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
                    const newStatus = 'unsaved';
                    return { activeProject: updated, saveStatus: newStatus };
                });
            },

            resetActiveProject: () => {
                set({ activeProject: null, activeProjectId: null, saveStatus: 'idle' });
            },

            setSaveStatus: (status) => set({ saveStatus: status }),
        }),
        {
            partialize: (state) => ({ activeProject: state.activeProject }),
            limit: 20, 
            equality: (a, b) => JSON.stringify(a) === JSON.stringify(b) 
        }
    )
);
