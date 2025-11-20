
// Types duplicated from transformations.ts as workers don't support direct TS imports easily in this setup
type CalcDataRow = Record<string, any>;
type SortTransformation = { type: 'sort'; payload: { key: string; direction: 'asc' | 'desc'; } };
type FilterTransformation = { type: 'filter'; payload: { logic: 'AND' | 'OR'; clauses: any[]; } };
type AddColumnTransformation = { type: 'add_column'; payload: { newColumnName: string; formula: string; } };
type RenameColumnTransformation = { type: 'rename_column'; payload: { oldName: string; newName: string; } };
type TransformTextTransformation = { type: 'transform_text'; payload: { column: string; transformType: 'uppercase' | 'lowercase' | 'capitalize'; } };
type GroupByTransformation = { type: 'group_by'; payload: { groupByColumns: string[]; aggregations: any[]; } };
type HideColumnsTransformation = { type: 'hide_columns'; payload: { columns: string[]; } };
type Transformation = SortTransformation | FilterTransformation | AddColumnTransformation | RenameColumnTransformation | TransformTextTransformation | GroupByTransformation | HideColumnsTransformation;

const evaluateFormula = (formula: string, row: CalcDataRow): number | string => {
    const columnRegex = /\[([^\]]+)\]/g;
    let expression = formula;
    let match;
    const columnsInFormula = new Set<string>();

    while ((match = columnRegex.exec(formula)) !== null) {
        columnsInFormula.add(match[1]);
    }
    
    const argValues: (string | number)[] = [];
    const argNames: string[] = [];

    for (const col of columnsInFormula) {
        if (col in row) {
            const val = Number(row[col]);
            if (isNaN(val)) return 'Error: Non-numeric value';
            argNames.push(col.replace(/\s/g, '_'));
            argValues.push(val);
            expression = expression.replace(`[${col}]`, col.replace(/\s/g, '_'));
        } else {
            return `Error: Column not found`;
        }
    }
    
    try {
        const func = new Function(...argNames, `return ${expression}`);
        return func(...argValues);
    } catch (e) {
        return 'Error: Invalid formula';
    }
};

const applyTransformations = (data: CalcDataRow[], transformations: Transformation[]): CalcDataRow[] => {
    if (!transformations || transformations.length === 0) {
        return data;
    }

    let processedData = [...data];

    for (const transform of transformations) {
        if (transform.type === 'sort') {
            const { key, direction } = transform.payload;
            processedData.sort((a, b) => {
                const aVal = a[key];
                const bVal = b[key];
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;
                if (typeof aVal === 'number' && typeof bVal === 'number') return direction === 'asc' ? aVal - bVal : bVal - aVal;
                return direction === 'asc' ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true }) : String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
            });
        }
        else if (transform.type === 'filter') {
            const { logic, clauses } = transform.payload;
            if (clauses.length === 0) continue;
            processedData = processedData.filter(row => {
                const results = clauses.map(clause => {
                    const cellValue = row[clause.column]; const clauseValue = clause.value;
                    const cellStr = String(cellValue ?? '').toLowerCase(); const clauseStr = String(clauseValue).toLowerCase();
                    switch (clause.condition) {
                        case 'contains': return cellStr.includes(clauseStr);
                        case 'does_not_contain': return !cellStr.includes(clauseStr);
                        case 'is': return cellStr === clauseStr; case 'is_not': return cellStr !== clauseStr;
                        case 'starts_with': return cellStr.startsWith(clauseStr); case 'ends_with': return cellStr.endsWith(clauseStr);
                        case 'is_empty': return cellValue === null || cellValue === undefined || cellValue === '';
                        case 'is_not_empty': return cellValue !== null && cellValue !== undefined && cellValue !== '';
                        case 'is_greater_than': return Number(cellValue) > Number(clauseValue); case 'is_less_than': return Number(cellValue) < Number(clauseValue);
                        case 'is_equal_to': return Number(cellValue) === Number(clauseValue); case 'is_not_equal_to': return Number(cellValue) !== Number(clauseValue);
                        default: return false;
                    }
                });
                return logic === 'AND' ? results.every(res => res) : results.some(res => res);
            });
        }
        else if (transform.type === 'add_column') {
            processedData = processedData.map(row => ({ ...row, [transform.payload.newColumnName]: evaluateFormula(transform.payload.formula, row) }));
        }
        else if (transform.type === 'rename_column') {
            const { oldName, newName } = transform.payload;
            if (oldName === newName || !processedData[0] || !(oldName in processedData[0])) continue;
            processedData = processedData.map(row => {
                const { [oldName]: value, ...rest } = row;
                return { ...rest, [newName]: value };
            });
        }
        else if (transform.type === 'transform_text') {
            const { column, transformType } = transform.payload;
            processedData = processedData.map(row => {
                const originalValue = row[column];
                if (typeof originalValue !== 'string') return row;
                let newValue = originalValue;
                switch (transformType) {
                    case 'uppercase': newValue = originalValue.toUpperCase(); break;
                    case 'lowercase': newValue = originalValue.toLowerCase(); break;
                    case 'capitalize': newValue = originalValue.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '); break;
                }
                return { ...row, [column]: newValue };
            });
        }
        else if (transform.type === 'group_by') {
             const { groupByColumns, aggregations } = transform.payload;
             if (groupByColumns.length === 0 || aggregations.length === 0) continue;

             const groupMap = new Map<string, any>();
             for (const row of processedData) {
                const key = groupByColumns.map(col => row[col]).join('||');
                if (!groupMap.has(key)) {
                    const newGroup: any = {};
                    groupByColumns.forEach(col => newGroup[col] = row[col]);
                    aggregations.forEach((agg: any) => {
                        newGroup[`${agg.column}_${agg.operation}_data`] = [];
                    });
                    groupMap.set(key, newGroup);
                }
                const group = groupMap.get(key);
                aggregations.forEach((agg: any) => {
                    const val = Number(row[agg.column]);
                    if (!isNaN(val)) group[`${agg.column}_${agg.operation}_data`].push(val);
                });
             }

             const aggregatedData: CalcDataRow[] = [];
             for (const group of groupMap.values()) {
                const newRow: CalcDataRow = {};
                groupByColumns.forEach(col => newRow[col] = group[col]);
                aggregations.forEach((agg: any) => {
                    const data = group[`${agg.column}_${agg.operation}_data`];
                    if (data.length === 0) { newRow[agg.newColumnName] = null; return; }
                    switch(agg.operation) {
                        case 'sum': newRow[agg.newColumnName] = data.reduce((a: number, b: number) => a + b, 0); break;
                        case 'average': newRow[agg.newColumnName] = data.reduce((a: number, b: number) => a + b, 0) / data.length; break;
                        case 'count': newRow[agg.newColumnName] = data.length; break;
                        case 'min': newRow[agg.newColumnName] = Math.min(...data); break;
                        case 'max': newRow[agg.newColumnName] = Math.max(...data); break;
                    }
                });
                aggregatedData.push(newRow);
             }
             processedData = aggregatedData;
        }
        else if (transform.type === 'hide_columns') {
            // Hide columns logic if needed, mostly handled by UI filtering, 
            // but can be done here to reduce payload size if desired.
            // For now, we'll keep data intact and filter in UI unless extremely large.
        }
    }
    return processedData;
};

self.onmessage = (event: MessageEvent) => {
    const { data, transformations } = event.data;
    try {
        const processed = applyTransformations(data, transformations);
        self.postMessage({ type: 'success', result: processed });
    } catch (error: any) {
        self.postMessage({ type: 'error', message: error.message });
    }
};
