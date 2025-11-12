


export type DataRow = Record<string, any>;

export type LoadingState = 'idle' | 'parsing' | 'validating_tasks' | 'scanning' | 'validated' | 'analyzing' | 'complete' | 'error';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'combo' | 'stacked-bar' | 'bubble';

export type AggregationType = 'sum' | 'average' | 'count' | 'none';

// Fix: Moved TimeGrain here to be shared across chart components.
export type TimeGrain = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ChartMapping {
    x: string;
    y: string;
    z?: string; // For bubble chart size
    color?: string;
    aggregation?: AggregationType;
}

export interface ChartConfig {
    id: string;
    type: ChartType;
    title: string;
    description: string;
    mapping: ChartMapping;
    colors?: string[];
}

export interface KpiConfig {
    id: string;
    title: string;
    column: string;
    operation: 'sum' | 'average' | 'count_distinct';
    format: 'number' | 'currency' | 'percent';
    isCustom?: boolean;
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