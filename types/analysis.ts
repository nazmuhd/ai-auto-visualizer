
import { ChartConfig } from './charts';

export interface KpiConfig {
    id: string;
    title: string;
    column: string;
    operation: 'sum' | 'average' | 'count_distinct';
    format: 'number' | 'currency' | 'percent';
    trendDirection?: 'higher-is-better' | 'lower-is-better';
    primaryCategory?: string; // e.g., 'Region'
    primaryCategoryValue?: string; // e.g., 'North America'
    isCustom?: boolean;
    visible?: boolean;
    multiplier?: number;
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
