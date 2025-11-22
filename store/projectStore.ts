
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Project } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';

interface ProjectState {
    projects: Project[];
    activeProjectId: string | null;
    saveStatus: 'idle' | 'unsaved' | 'saving' | 'saved';
    
    // Actions
    createProject: (name: string, description: string) => Project;
    setActiveProject: (id: string | null) => void;
    updateProject: (id: string, updater: (p: Project) => Project) => void;
    updateActiveProject: (updater: (p: Project) => Project) => void;
    deleteProject: (id: string) => void;
    renameProject: (id: string, name: string, description: string) => void;
    setSaveStatus: (status: 'idle' | 'unsaved' | 'saving' | 'saved') => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            projects: [],
            activeProjectId: null,
            saveStatus: 'idle',

            createProject: (name, description) => {
                const newProject: Project = {
                    id: uuidv4(),
                    name,
                    description,
                    createdAt: new Date(),
                    lastSaved: new Date(),
                    dataSource: { name: 'No data source', data: [] },
                    analysis: null,
                };
                set(state => ({ 
                    projects: [newProject, ...state.projects],
                    activeProjectId: newProject.id,
                    saveStatus: 'idle'
                }));
                return newProject;
            },

            setActiveProject: (id) => set({ activeProjectId: id, saveStatus: 'idle' }),

            updateProject: (id, updater) => set(state => {
                const projects = state.projects.map(p => p.id === id ? updater(p) : p);
                return { projects };
            }),

            updateActiveProject: (updater) => set(state => {
                if (!state.activeProjectId) return {};
                const projects = state.projects.map(p => 
                    p.id === state.activeProjectId ? { ...updater(p), lastSaved: new Date() } : p
                );
                return { projects, saveStatus: 'unsaved' };
            }),

            deleteProject: (id) => set(state => ({
                projects: state.projects.filter(p => p.id !== id),
                activeProjectId: state.activeProjectId === id ? null : state.activeProjectId
            })),

            renameProject: (id, name, description) => set(state => ({
                projects: state.projects.map(p => 
                    p.id === id ? { ...p, name, description, lastSaved: new Date() } : p
                )
            })),

            setSaveStatus: (status) => set({ saveStatus: status }),
        }),
        {
            name: 'ai-insights-projects',
            storage: createJSONStorage(() => localStorage),
            // Handle Date serialization
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.projects = state.projects.map(p => ({
                        ...p,
                        createdAt: new Date(p.createdAt),
                        lastSaved: p.lastSaved ? new Date(p.lastSaved) : undefined
                    }));
                }
            }
        }
    )
);
