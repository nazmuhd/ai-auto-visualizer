
import Dexie, { Table } from 'dexie';
import { DataRow } from '../types.ts';

class ProjectDatabase extends Dexie {
    projectData!: Table<{ id: string; data: DataRow[] }>;

    constructor() {
        super('AIInsightsDB');
        (this as any).version(1).stores({
            projectData: 'id' // Primary key is project ID
        });
    }
}

export const db = new ProjectDatabase();
