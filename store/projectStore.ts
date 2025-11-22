
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Project } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';

interface ProjectState {
    projects: Project[];
    activeProjectId: string | null;
    saveStatus: 'idle' | 'unsaved' | 'saving' | 'saved';
    
    // Undo/Redo History Stacks (Runtime only, not persisted)
    past: Project[][];
    future: Project[][];

    // Actions
    createProject: (name: string, description: string) => Project;
    setActiveProject: (id: string | null) => void;
    updateProject: (id: string, updater: (p: Project) => void) => void; 
    updateActiveProject: (updater: (p: Project) => void) => void;
    deleteProject: (id: string) => void;
    renameProject: (id: string, name: string, description: string) => void;
    saveProject: (name: string, description: string) => void;
    setSaveStatus: (status: 'idle' | 'unsaved' | 'saving' | 'saved') => void;
    undo: () => void;
    redo: () => void;
}

const MAX_HISTORY = 20;

export const useProjectStore = create<ProjectState>()(
    persist(
        immer((set, get) => ({
            projects: [],
            activeProjectId: null,
            saveStatus: 'idle',
            past: [],
            future: [],

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
                set(state => {
                    state.projects.unshift(newProject);
                    state.activeProjectId = newProject.id;
                    state.saveStatus = 'idle';
                    state.past = [];
                    state.future = [];
                });
                return newProject;
            },

            setActiveProject: (id) => set(state => {
                state.activeProjectId = id;
                state.saveStatus = 'idle';
                state.past = []; 
                state.future = [];
            }),

            updateProject: (id, updater) => set(state => {
                const project = state.projects.find(p => p.id === id);
                if (project) {
                    updater(project);
                }
            }),

            updateActiveProject: (updater) => set(state => {
                if (!state.activeProjectId) return;
                
                // Snapshot for Undo
                const currentProjectsSnapshot = JSON.parse(JSON.stringify(state.projects));
                state.past.push(currentProjectsSnapshot);
                if (state.past.length > MAX_HISTORY) state.past.shift();
                state.future = []; 

                const project = state.projects.find(p => p.id === state.activeProjectId);
                if (project) {
                    updater(project);
                    project.lastSaved = new Date();
                    state.saveStatus = 'unsaved';
                }
            }),

            deleteProject: (id) => set(state => {
                state.projects = state.projects.filter(p => p.id !== id);
                if (state.activeProjectId === id) {
                    state.activeProjectId = null;
                }
            }),

            renameProject: (id, name, description) => set(state => {
                const project = state.projects.find(p => p.id === id);
                if (project) {
                    project.name = name;
                    project.description = description;
                    project.lastSaved = new Date();
                }
            }),

            saveProject: (name, description) => set(state => {
                const project = state.projects.find(p => p.id === state.activeProjectId);
                if (project) {
                    project.name = name;
                    project.description = description;
                    project.lastSaved = new Date();
                    state.saveStatus = 'saved';
                }
            }),

            setSaveStatus: (status) => set(state => {
                state.saveStatus = status;
            }),

            undo: () => set(state => {
                if (state.past.length === 0) return;
                const previous = state.past.pop();
                if (previous) {
                    const current = JSON.parse(JSON.stringify(state.projects));
                    state.future.push(current);
                    state.projects = previous;
                    // Restore dates from JSON serialization
                    state.projects.forEach(p => {
                        p.createdAt = new Date(p.createdAt);
                        if (p.lastSaved) p.lastSaved = new Date(p.lastSaved);
                    });
                }
            }),

            redo: () => set(state => {
                if (state.future.length === 0) return;
                const next = state.future.pop();
                if (next) {
                    const current = JSON.parse(JSON.stringify(state.projects));
                    state.past.push(current);
                    state.projects = next;
                    state.projects.forEach(p => {
                        p.createdAt = new Date(p.createdAt);
                        if (p.lastSaved) p.lastSaved = new Date(p.lastSaved);
                    });
                }
            })
        })),
        {
            name: 'ai-insights-projects',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                projects: state.projects, 
                activeProjectId: state.activeProjectId 
            }), // Don't persist history or saveStatus
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Rehydrate dates
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
