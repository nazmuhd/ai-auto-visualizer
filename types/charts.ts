
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
