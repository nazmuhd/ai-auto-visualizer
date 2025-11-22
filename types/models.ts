
import { AnalysisResult } from './analysis';
import { Transformation } from './transformations';
import { Presentation } from './report';

export type DataRow = Record<string, any>;

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    lastSaved?: Date;
    dataSource: {
        name: string;
        data: DataRow[];
    };
    analysis: AnalysisResult | null;
    transformations?: Transformation[];
    presentations?: Presentation[];
}

export type LoadingState = 'idle' | 'parsing' | 'validating_tasks' | 'scanning' | 'validated' | 'analyzing' | 'complete' | 'error';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';
