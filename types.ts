export type DataRow = Record<string, any>;

export type LoadingState = 'idle' | 'parsing' | 'validating_tasks' | 'scanning' | 'validated' | 'analyzing' | 'complete' | 'error';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'combo' | 'stacked-bar' | 'bubble';

export type AggregationType = 'sum' | 'average' | 'count' | 'none';

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
    visible?: boolean;
}

export interface KpiConfig {
    id:string;
    title: string;
    column: string;
    operation: 'sum' | 'average' | 'count_distinct';
    format: 'number' | 'currency' | 'percent';
    trendDirection?: 'higher-is-better' | 'lower-is-better'; // For color coding
    primaryCategory?: string; // e.g., 'Region'
    primaryCategoryValue?: string; // e.g., 'North America'
    isCustom?: boolean;
    visible?: boolean;
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

export interface LayoutInfo {
  id: string;
  name: string;
  rows: number[];
  totalCharts: number;
  description: string;
  usedBy: string;
}