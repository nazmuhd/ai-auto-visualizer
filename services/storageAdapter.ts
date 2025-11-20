
import { Project, ProjectMetadata } from '../types.ts';
import { db } from '../db/db.ts';

const KEYS = {
    METADATA: 'ai-insights-meta',
    PROJECT_PREFIX: 'proj_'
};

// Helper to revive dates from JSON
const dateReviver = (key: string, value: any) => {
    if ((key === 'createdAt' || key === 'lastSaved') && typeof value === 'string') {
        return new Date(value);
    }
    return value;
};

export const StorageAdapter = {
    /**
     * Migrates legacy monolithic storage to split storage (metadata + individual files)
     */
    migrateIfNeeded: async (): Promise<void> => {
        try {
            const legacyData = localStorage.getItem('ai-insights-projects');
            if (!legacyData) return;

            console.log("Migrating legacy project data...");
            const projects: Project[] = JSON.parse(legacyData, dateReviver);
            
            const metadataList: ProjectMetadata[] = [];

            for (const p of projects) {
                try {
                    // 1. Move heavy data to IndexedDB
                    await db.projectData.put({ id: p.id, data: p.dataSource.data });
                    
                    // 2. Create lightweight project object for LocalStorage
                    const lightweightProject = { ...p, dataSource: { ...p.dataSource, data: [] } };
                    localStorage.setItem(`${KEYS.PROJECT_PREFIX}${p.id}`, JSON.stringify(lightweightProject));
                    
                    // 3. Add to metadata list
                    metadataList.push({
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        createdAt: p.createdAt,
                        lastSaved: p.lastSaved
                    });
                } catch (e) {
                    console.error(`Failed to migrate project ${p.id}`, e);
                }
            }

            // Save metadata
            localStorage.setItem(KEYS.METADATA, JSON.stringify(metadataList));
            
            // Remove legacy key after successful migration
            localStorage.removeItem('ai-insights-projects');
            console.log("Migration complete.");

        } catch (e) {
            console.error("Migration failed", e);
        }
    },

    getProjectList: (): ProjectMetadata[] => {
        try {
            const json = localStorage.getItem(KEYS.METADATA);
            return json ? JSON.parse(json, dateReviver) : [];
        } catch (e) {
            console.error("Failed to load project list", e);
            return [];
        }
    },

    saveProjectList: (list: ProjectMetadata[]): void => {
        try {
            localStorage.setItem(KEYS.METADATA, JSON.stringify(list));
        } catch (e) {
            console.error("Failed to save project list", e);
        }
    },

    /**
     * Loads the project structure from LocalStorage.
     * @param id Project ID
     * @param loadData If true, also fetches the heavy data from IndexedDB. If false, data is empty.
     */
    loadProject: async (id: string, loadData: boolean = true): Promise<Project | null> => {
        try {
            // 1. Load structure from LocalStorage
            const json = localStorage.getItem(`${KEYS.PROJECT_PREFIX}${id}`);
            if (!json) return null;
            
            const project: Project = JSON.parse(json, dateReviver);

            // 2. Load large data from IndexedDB if requested
            if (loadData) {
                const dataRecord = await db.projectData.get(id);
                if (dataRecord) {
                    project.dataSource.data = dataRecord.data;
                } else {
                    console.warn(`Data missing for project ${id} in IndexedDB.`);
                    project.dataSource.data = [];
                }
            } else {
                // Ensure it's initialized array even if skipped
                project.dataSource.data = [];
            }

            return project;
        } catch (e) {
            console.error(`Failed to load project ${id}`, e);
            return null;
        }
    },

    /**
     * Fetches specifically the raw data rows for a project from IndexedDB.
     * Used for decoupling large data from the main store.
     */
    getProjectData: async (id: string): Promise<any[]> => {
        try {
            if (id.startsWith('unsaved_')) return []; // Unsaved projects handle data in memory/store until saved
            const dataRecord = await db.projectData.get(id);
            return dataRecord ? dataRecord.data : [];
        } catch (e) {
            console.error(`Failed to load data for project ${id}`, e);
            return [];
        }
    },

    saveProject: async (project: Project): Promise<void> => {
        try {
            // 1. Save heavy data to IndexedDB
            await db.projectData.put({ id: project.id, data: project.dataSource.data });

            // 2. Save structure (without heavy data) to LocalStorage
            const lightweightProject = { ...project, dataSource: { ...project.dataSource, data: [] } };
            localStorage.setItem(`${KEYS.PROJECT_PREFIX}${project.id}`, JSON.stringify(lightweightProject));
            
            // 3. Update metadata list
            const list = StorageAdapter.getProjectList();
            const meta: ProjectMetadata = {
                id: project.id,
                name: project.name,
                description: project.description,
                createdAt: project.createdAt,
                lastSaved: new Date()
            };
            
            const index = list.findIndex(p => p.id === project.id);
            if (index >= 0) {
                list[index] = meta;
            } else {
                list.unshift(meta);
            }
            
            StorageAdapter.saveProjectList(list);
        } catch (e) {
            console.error(`Failed to save project ${project.id}`, e);
            throw e;
        }
    },

    deleteProject: async (id: string): Promise<void> => {
        try {
            await db.projectData.delete(id);
            localStorage.removeItem(`${KEYS.PROJECT_PREFIX}${id}`);
            const list = StorageAdapter.getProjectList().filter(p => p.id !== id);
            StorageAdapter.saveProjectList(list);
        } catch (e) {
            console.error(`Failed to delete project ${id}`, e);
        }
    }
};
