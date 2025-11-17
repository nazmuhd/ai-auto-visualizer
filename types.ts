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
    multiplier?: number;
}

export interface TextBlock {
    id: string;
    type: 'text';
    title: string;
    content: string;
    style?: 'title' | 'subtitle' | 'body';
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


export interface ReportLayoutItem {
    i: string; // Unique identifier for the grid item (e.g., chart id, kpi id)
    x: number;
    y: number;
    w: number;
    h: number;
    isDraggable?: boolean;
    isResizable?: boolean;
}

// --- Presentation Studio 2.0 Types ---
export interface Slide {
    id: string;
    layout: ReportLayoutItem[];
}

export interface Presentation {
    id: string;
    name: string;
    format: 'slides' | 'document';
    slides: Slide[];
    themeSettings?: object;
    textBlocks?: TextBlock[];
    header?: TextBlock;
    footer?: TextBlock;
}

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


export type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'about' | 'pricing';

export interface LayoutInfo {
  id: string;
  name: string;
  rows: number[];
  totalCharts: number;
  description: string;
  usedBy: string;
}

export type PresentationFormat = 'slides' | 'document';

export interface ReportTemplate {
  id: string;
  format: PresentationFormat;
  name: string;
  company: string;
  range: string;
  description: string;
}

export interface ChatMessage {
    role: 'user' | 'ai' | 'system';
    content: string;
}

// --- Data Studio 2.0 Types ---

export type SortTransformation = {
    type: 'sort';
    payload: {
        key: string;
        direction: 'asc' | 'desc';
    }
}

export type HideColumnsTransformation = {
    type: 'hide_columns';
    payload: {
        columns: string[];
    }
}

export type FilterCondition = 
    | 'contains' | 'does_not_contain' | 'is' | 'is_not' | 'starts_with' | 'ends_with'
    | 'is_empty' | 'is_not_empty'
    | 'is_greater_than' | 'is_less_than' | 'is_equal_to' | 'is_not_equal_to';

export interface FilterClause {
    id: string;
    column: string;
    condition: FilterCondition;
    value: string;
}

export type FilterTransformation = {
    type: 'filter';
    payload: {
        logic: 'AND' | 'OR';
        clauses: FilterClause[];
    }
}

export type AddColumnTransformation = {
    type: 'add_column';
    payload: {
        newColumnName: string;
        formula: string; // e.g., "[Revenue] - [Cost]"
    }
}

export interface AggregationConfig {
    id: string;
    column: string;
    operation: 'sum' | 'average' | 'count' | 'min' | 'max';
    newColumnName: string;
}

export type GroupByTransformation = {
    type: 'group_by';
    payload: {
        groupByColumns: string[];
        aggregations: AggregationConfig[];
    }
}

export type RenameColumnTransformation = {
    type: 'rename_column';
    payload: {
        oldName: string;
        newName: string;
    }
}

export type TransformTextTransformation = {
    type: 'transform_text';
    payload: {
        column: string;
        transformType: 'uppercase' | 'lowercase' | 'capitalize';
    }
}


export type Transformation = 
    | SortTransformation 
    | HideColumnsTransformation 
    | FilterTransformation 
    | AddColumnTransformation 
    | GroupByTransformation
    | RenameColumnTransformation
    | TransformTextTransformation;