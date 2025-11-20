
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
