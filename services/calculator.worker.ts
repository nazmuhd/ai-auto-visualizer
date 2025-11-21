
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

// --- Safe Formula Engine (Tokenizer & RPN Evaluator) ---

type TokenType = 'NUMBER' | 'OPERATOR' | 'VARIABLE' | 'LPAREN' | 'RPAREN';
type Token = { type: TokenType, value: string };

const tokenize = (formula: string): Token[] => {
    const tokens: Token[] = [];
    let i = 0;
    while (i < formula.length) {
        const char = formula[i];
        
        // Skip whitespace
        if (/\s/.test(char)) {
            i++;
            continue;
        }
        
        // Numbers
        if (/[0-9.]/.test(char)) {
            let num = char;
            while (i + 1 < formula.length && /[0-9.]/.test(formula[i + 1])) {
                num += formula[++i];
            }
            tokens.push({ type: 'NUMBER', value: num });
        } 
        // Operators
        else if (['+', '-', '*', '/'].includes(char)) {
            tokens.push({ type: 'OPERATOR', value: char });
        } 
        // Parentheses
        else if (char === '(') {
            tokens.push({ type: 'LPAREN', value: '(' });
        } else if (char === ')') {
            tokens.push({ type: 'RPAREN', value: ')' });
        } 
        // Variables [Column Name]
        else if (char === '[') {
            let varName = '';
            i++; // skip [
            while (i < formula.length && formula[i] !== ']') {
                varName += formula[i];
                i++;
            }
            // i is now at ]
            tokens.push({ type: 'VARIABLE', value: varName });
        } else {
            // Skip unknown characters silently or throw error. 
            // For robustness, we'll skip but logging would be ideal in a dev env.
        }
        i++;
    }
    return tokens;
};

// Shunting-yard algorithm to convert Infix to Reverse Polish Notation (RPN)
const toRPN = (tokens: Token[]): Token[] => {
    const outputQueue: Token[] = [];
    const operatorStack: Token[] = [];
    const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

    for (const token of tokens) {
        if (token.type === 'NUMBER' || token.type === 'VARIABLE') {
            outputQueue.push(token);
        } else if (token.type === 'OPERATOR') {
            while (
                operatorStack.length > 0 &&
                operatorStack[operatorStack.length - 1].type === 'OPERATOR' &&
                precedence[operatorStack[operatorStack.length - 1].value] >= precedence[token.value]
            ) {
                outputQueue.push(operatorStack.pop()!);
            }
            operatorStack.push(token);
        } else if (token.type === 'LPAREN') {
            operatorStack.push(token);
        } else if (token.type === 'RPAREN') {
            while (
                operatorStack.length > 0 &&
                operatorStack[operatorStack.length - 1].type !== 'LPAREN'
            ) {
                outputQueue.push(operatorStack.pop()!);
            }
            if (operatorStack.length === 0) throw new Error("Mismatched parentheses");
            operatorStack.pop(); // Pop LPAREN
        }
    }
    while (operatorStack.length > 0) {
        const op = operatorStack.pop()!;
        if (op.type === 'LPAREN') throw new Error("Mismatched parentheses");
        outputQueue.push(op);
    }
    return outputQueue;
};

const evaluateRPN = (rpn: Token[], row: CalcDataRow): number => {
    const stack: number[] = [];
    for (const token of rpn) {
        if (token.type === 'NUMBER') {
            stack.push(parseFloat(token.value));
        } else if (token.type === 'VARIABLE') {
            if (!(token.value in row)) throw new Error(`Column '${token.value}' not found`);
            const val = Number(row[token.value]);
            if (isNaN(val)) throw new Error(`Value in '${token.value}' is not a number`);
            stack.push(val);
        } else if (token.type === 'OPERATOR') {
            if (stack.length < 2) throw new Error("Invalid expression");
            const b = stack.pop()!;
            const a = stack.pop()!;
            switch (token.value) {
                case '+': stack.push(a + b); break;
                case '-': stack.push(a - b); break;
                case '*': stack.push(a * b); break;
                case '/': 
                    if(b === 0) throw new Error("Division by zero");
                    stack.push(a / b); 
                    break;
            }
        }
    }
    if (stack.length !== 1) throw new Error("Invalid formula result");
    return stack[0];
};

const parseFormulaToRPN = (formula: string): Token[] => {
    const tokens = tokenize(formula);
    return toRPN(tokens);
};

// --- Transformation Logic ---

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
            try {
                // Parse formula ONCE for the entire column (Performance optimization)
                const rpn = parseFormulaToRPN(transform.payload.formula);
                
                processedData = processedData.map(row => {
                    try {
                        const result = evaluateRPN(rpn, row);
                        return { ...row, [transform.payload.newColumnName]: result };
                    } catch (e) {
                        return { ...row, [transform.payload.newColumnName]: null }; // Or error string
                    }
                });
            } catch (e) {
                // If parsing fails (syntax error), set error for all rows
                processedData = processedData.map(row => ({ ...row, [transform.payload.newColumnName]: 'Error: Invalid Formula' }));
            }
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
            // Logic handled mostly by UI to preserve data integrity, but can be stripped here if payload size is a concern.
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
