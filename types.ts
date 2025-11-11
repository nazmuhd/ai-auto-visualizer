

export type DataRow = Record<string, any>;

export type LoadingState = 'idle' | 'parsing' | 'validating_tasks' | 'scanning' | 'validated' | 'analyzing' | 'complete' | 'error';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter';

export type AggregationType = 'sum' | 'average' | 'count' | 'none';

export interface ChartMapping {
    x: string;
    y: string;
    color?: string;
    aggregation?: AggregationType;
}

export interface ChartConfig {
    id: string;
    type: ChartType;
    title: string;
    description: string;
    mapping: ChartMapping;
}

export interface KpiConfig {
    title: string;
    column: string;
    operation: 'sum' | 'average' | 'count_distinct';
    format: 'number' | 'currency' | 'percent';
}

export interface AnalysisResult {
    summary: string[];
    kpis: KpiConfig[];
    charts: ChartConfig[];
}

export interface DataIssue {
    type: 'missing_values' | 'duplicates' | 'data_type_mismatch' | 'empty_file';
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
}

export interface DataQualityReport {
    score: number;
    issues: DataIssue[];
    rowCount: number;
    columnCount: number;
    isClean: boolean;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    isUnsaved?: boolean;
    dataSource: {
        name: string;
        data: DataRow[];
    };
    analysis: AnalysisResult | null;
    aiReport: {
        content: string;
        status: 'idle' | 'generating' | 'complete';
    } | null;
}


export type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'about' | 'pricing';