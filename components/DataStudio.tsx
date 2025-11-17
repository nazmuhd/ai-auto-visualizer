import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project, DataRow, ChatMessage, Transformation, SortTransformation, HideColumnsTransformation, FilterTransformation, AddColumnTransformation, GroupByTransformation, RenameColumnTransformation, TransformTextTransformation } from '../types.ts';
import { 
    ChevronLeft, ChevronRight, Sparkles, Send, Loader2, User, Bot, ChevronsLeft, ChevronsRight, Maximize,
    Minimize, ArrowUp, ArrowDown, MoreVertical, EyeOff, X, Columns, Filter as FilterIcon, Settings, PlusCircle,
    BarChart3, CaseSensitive, Pencil, Sigma, CalendarDays, ArrowDown01, ArrowUp10, PanelLeft, PanelRight
} from 'lucide-react';
import { queryDataWithAI } from '../services/geminiService.ts';
import { ChooseColumnsModal } from './modals/ChooseColumnsModal.tsx';
import { FilterRowsModal } from './modals/FilterRowsModal.tsx';
import { AddColumnModal } from './modals/AddColumnModal.tsx';
import { GroupByModal } from './modals/GroupByModal.tsx';

interface Props {
  project: Project;
  onProjectUpdate: (updater: (prev: Project) => Project) => void;
}

const ROWS_PER_PAGE = 50;

const evaluateFormula = (formula: string, row: DataRow): number | string => {
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

const applyTransformations = (data: DataRow[], transformations: Transformation[]): DataRow[] => {
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
                    aggregations.forEach(agg => {
                        newGroup[`${agg.column}_${agg.operation}_data`] = [];
                    });
                    groupMap.set(key, newGroup);
                }
                const group = groupMap.get(key);
                aggregations.forEach(agg => {
                    const val = Number(row[agg.column]);
                    if (!isNaN(val)) group[`${agg.column}_${agg.operation}_data`].push(val);
                });
             }

             const aggregatedData: DataRow[] = [];
             for (const group of groupMap.values()) {
                const newRow: DataRow = {};
                groupByColumns.forEach(col => newRow[col] = group[col]);
                aggregations.forEach(agg => {
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
    }
    return processedData;
};

const getTransformationDescription = (t: Transformation): string => {
    switch (t.type) {
        case 'sort': return `Sorted by ${t.payload.key} (${t.payload.direction})`;
        case 'hide_columns': return `Hid ${t.payload.columns.length} column(s)`;
        case 'filter': return `Filtered by ${t.payload.clauses.length} condition(s)`;
        case 'add_column': return `Added column "${t.payload.newColumnName}"`;
        case 'rename_column': return `Renamed "${t.payload.oldName}" to "${t.payload.newName}"`;
        case 'transform_text': return `Transformed ${t.payload.column} to ${t.payload.transformType}`;
        case 'group_by': return `Grouped by ${t.payload.groupByColumns.join(', ')}`;
        default: return 'Unknown step';
    }
};

const detectColumnType = (data: DataRow[], columnName: string): 'text' | 'number' | 'date' => {
    const sample = data.slice(0, 100).map(row => row[columnName]).filter(val => val !== null && val !== undefined && val !== '');
    if (sample.length === 0) return 'text';

    const allNumbers = sample.every(val => !isNaN(Number(val)) && String(val).trim() !== '');
    if (allNumbers) return 'number';

    const allDates = sample.every(val => typeof val === 'string' && !isNaN(Date.parse(val)) && isNaN(Number(val)));
    if (allDates) return 'date';
    
    return 'text';
};

const AppliedStepsPanel: React.FC<{
    transformations: Transformation[];
    isGrouped: boolean;
    onAddColumn: () => void;
    onChooseColumns: () => void;
    onFilterRows: () => void;
    onGroupBy: () => void;
    onRemoveTransformation: (index: number) => void;
}> = ({ transformations, isGrouped, onAddColumn, onChooseColumns, onFilterRows, onGroupBy, onRemoveTransformation }) => (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm">
        <header className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <h3 className="font-semibold text-slate-900">Applied Steps</h3>
        </header>
        <div className="flex-shrink-0 p-3 space-y-2 border-b border-slate-100">
            <button onClick={onAddColumn} disabled={isGrouped} className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"><PlusCircle size={14} className="mr-2"/> Add Column</button>
            <button onClick={onChooseColumns} disabled={isGrouped} className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"><Columns size={14} className="mr-2"/> Choose Columns</button>
            <button onClick={onFilterRows} disabled={isGrouped} className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"><FilterIcon size={14} className="mr-2"/> Filter Rows</button>
            <button onClick={onGroupBy} disabled={isGrouped} className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"><BarChart3 size={14} className="mr-2"/> Group By</button>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
            {transformations.map((t, i) => (
                <div key={i} className="group flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100">
                    <div className="flex items-center text-sm text-slate-600">
                        <span className="font-mono text-xs mr-2 text-slate-400">{i + 1}.</span>
                        <Settings size={14} className="mr-2 text-slate-400" />
                        <span className="truncate">{getTransformationDescription(t)}</span>
                    </div>
                    <button onClick={() => onRemoveTransformation(i)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><X size={14} /></button>
                </div>
            ))}
        </div>
    </div>
);


const AskAI: React.FC<{ data: DataRow[] }> = ({ data }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'ai', content: "Hello! Ask me anything about your current data view." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
    
    const sampleData = useMemo(() => {
        if (data.length <= 50) return data;
        const head = data.slice(0, 25);
        const tail = data.slice(data.length - 25);
        return [...head, ...tail];
    }, [data]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await queryDataWithAI(sampleData, input);
            setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm">
            <header className="px-4 py-3 border-b border-slate-100 flex-shrink-0"><h3 className="font-semibold text-slate-900 flex items-center"><Sparkles size={16} className="mr-2 text-primary-500 fill-primary-500" />Ask AI</h3></header>
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-primary-600"/></div>}
                        <div className={`p-3 rounded-2xl max-w-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-slate-200 text-slate-800 rounded-bl-lg'}`}>{msg.content}</div>
                        {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0"><User size={18} className="text-white"/></div>}
                    </div>
                ))}
                {isLoading && <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-primary-600"/></div><div className="p-3 rounded-2xl bg-slate-200"><Loader2 size={16} className="text-slate-500 animate-spin" /></div></div>}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-4 border-t border-slate-100 flex-shrink-0">
                <div className="relative">
                     <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="e.g., What is the total revenue?" className="w-full pr-12 pl-4 py-2.5 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" disabled={isLoading} />
                    <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-300"><Send size={16} /></button>
                </div>
            </footer>
        </div>
    );
};

interface ContextMenuState {
    x: number;
    y: number;
    column: string;
    columnType: 'text' | 'number' | 'date';
}

const ColumnContextMenu: React.FC<{
    menuState: ContextMenuState | null;
    onClose: () => void;
    onSort: (key: string, dir?: 'asc' | 'desc') => void;
    onHide: (key: string) => void;
    onRename: (key: string) => void;
    onTextTransform: (key: string, type: 'uppercase' | 'lowercase' | 'capitalize') => void;
    onQuickCalc: (key: string, op: 'sum' | 'average' | 'count') => void;
    onFilter: () => void;
}> = ({ menuState, onClose, onSort, onHide, onRename, onTextTransform, onQuickCalc, onFilter }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (!menuState) return null;

    const { x, y, column, columnType } = menuState;
    const menuStyle = { top: `${y}px`, left: `${x}px` };

    return (
        <div ref={menuRef} style={menuStyle} className="fixed bg-white rounded-lg shadow-lg border border-slate-200 w-56 py-1 z-[100001]">
            {columnType === 'text' && <>
                <button onMouseDown={() => onSort(column, 'asc')} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"><ArrowUp size={14} className="mr-2"/> Sort A → Z</button>
                <button onMouseDown={() => onSort(column, 'desc')} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"><ArrowDown size={14} className="mr-2"/> Sort Z → A</button>
                <div className="my-1 border-t border-slate-100"></div>
                <div className="relative group/sub"><button className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"><div className="flex items-center"><CaseSensitive size={14} className="mr-2"/> Transform</div><ChevronRight size={14} /></button><div className="absolute left-full -top-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 hidden group-hover/sub:block"><button onMouseDown={() => onTextTransform(column, 'uppercase')} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">UPPERCASE</button><button onMouseDown={() => onTextTransform(column, 'lowercase')} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">lowercase</button><button onMouseDown={() => onTextTransform(column, 'capitalize')} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Capitalize</button></div></div>
            </>}
            {columnType === 'number' && <>
                <button onMouseDown={() => onSort(column, 'asc')} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"><ArrowDown01 size={14} className="mr-2"/> Sort Smallest to Largest</button>
                <button onMouseDown={() => onSort(column, 'desc')} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"><ArrowUp10 size={14} className="mr-2"/> Sort Largest to Smallest</button>
                <div className="my-1 border-t border-slate-100"></div>
                <div className="relative group/sub"><button className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"><div className="flex items-center"><Sigma size={14} className="mr-2"/> Quick Calculation</div><ChevronRight size={14} /></button><div className="absolute left-full -top-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 hidden group-hover/sub:block"><button onMouseDown={() => onQuickCalc(column, 'sum')} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Sum</button><button onMouseDown={() => onQuickCalc(column, 'average')} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Average</button><button onMouseDown={() => onQuickCalc(column, 'count')} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Count</button></div></div>
            </>}
            {columnType === 'date' && <>
                <button onMouseDown={() => onSort(column, 'asc')} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"><CalendarDays size={14} className="mr-2"/> Sort Oldest to Newest</button>
                <button onMouseDown={() => onSort(column, 'desc')} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"><CalendarDays size={14} className="mr-2"/> Sort Newest to Oldest</button>
            </>}
            <div className="my-1 border-t border-slate-100"></div>
            <button onMouseDown={onFilter} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"><FilterIcon size={14} className="mr-2"/> Filter...</button>
            <button onMouseDown={() => onHide(column)} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"><EyeOff size={14} className="mr-2"/> Hide Column</button>
            <button onMouseDown={() => onRename(column)} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center"><Pencil size={14} className="mr-2"/> Rename...</button>
        </div>
    );
};

const DataTable: React.FC<{
    headers: string[];
    data: DataRow[];
    sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
    filteredColumns: Set<string>;
    onSort: (key: string) => void;
    onMenuOpen: (e: React.MouseEvent, h: string) => void;
}> = ({ headers, data, sortConfig, filteredColumns, onSort, onMenuOpen }) => (
    <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-auto custom-scrollbar">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>{headers.map(h => (<th key={h} className="px-4 py-2.5 font-medium text-slate-600 uppercase tracking-wider text-xs whitespace-nowrap group"><div className="flex items-center justify-between"><button onClick={() => onSort(h)} className="flex items-center w-full text-left">{h}{sortConfig?.key === h && (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-2" /> : <ArrowDown size={14} className="ml-2" />)}{filteredColumns.has(h) && <FilterIcon size={12} className="ml-2 text-primary-600" />}</button><button onClick={(e) => onMenuOpen(e, h)} className="ml-2 p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-slate-200"><MoreVertical size={14} /></button></div></th>))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">{data.map((row, i) => (<tr key={i} className="hover:bg-slate-50">{headers.map(h => (<td key={`${i}-${h}`} className="px-4 py-3 text-slate-600 whitespace-nowrap max-w-xs truncate" title={String(row[h])}>{String(row[h] ?? '').trim() ? String(row[h]) : <em className="text-slate-400">null</em>}</td>))}</tr>))}</tbody>
            </table>
        </div>
    </div>
);


export const DataStudio: React.FC<Props> = ({ project, onProjectUpdate }) => {
    const [page, setPage] = useState(0);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isChooseColumnsModalOpen, setIsChooseColumnsModalOpen] = useState(false);
    const [isFilterModalOpen, setFilterModalOpen] = useState(false);
    const [isAddColumnModalOpen, setAddColumnModalOpen] = useState(false);
    const [isGroupByModalOpen, setGroupByModalOpen] = useState(false);

    // Normal view state
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

    // Fullscreen view state
    const [isFsLeftPanelOpen, setIsFsLeftPanelOpen] = useState(false);
    const [isFsRightPanelOpen, setIsFsRightPanelOpen] = useState(false);
    
    const transformations = project.transformations || [];
    const originalData = project.dataSource.data;
    const isGrouped = useMemo(() => transformations.some(t => t.type === 'group_by'), [transformations]);

    const { transformedData, columnsAfterTransform } = useMemo(() => {
        let data = originalData;
        let columns: string[] = data.length > 0 ? Object.keys(data[0]) : [];
        
        for (const transform of transformations) {
            data = applyTransformations(data, [transform]);
            if (data.length > 0) columns = Object.keys(data[0]);
        }
        return { transformedData: data, columnsAfterTransform: columns };
    }, [originalData, transformations]);
    
    const columnTypes = useMemo(() => {
        const types: Record<string, 'text' | 'number' | 'date'> = {};
        columnsAfterTransform.forEach(col => { types[col] = detectColumnType(transformedData, col); });
        return types;
    }, [columnsAfterTransform, transformedData]);

    const hiddenColumnsSet = useMemo(() => {
        const hidden = new Set<string>();
        transformations.forEach(t => { if (t.type === 'hide_columns') t.payload.columns.forEach(col => hidden.add(col)); });
        return hidden;
    }, [transformations]);

    const sortConfig = useMemo(() => {
        return [...transformations].reverse().find(t => t.type === 'sort') as SortTransformation | undefined;
    }, [transformations])?.payload || null;
    
    const filteredColumnsSet = useMemo(() => {
        const filtered = new Set<string>();
        transformations.forEach(t => { if (t.type === 'filter') t.payload.clauses.forEach(clause => filtered.add(clause.column)); });
        return filtered;
    }, [transformations]);

    const addTransformation = useCallback((t: Transformation) => {
        onProjectUpdate(p => ({ ...p, transformations: [...(p.transformations || []), t] }));
    }, [onProjectUpdate]);

    const removeTransformation = useCallback((index: number) => {
        onProjectUpdate(p => ({ ...p, transformations: (p.transformations || []).filter((_, i) => i !== index) }));
    }, [onProjectUpdate]);

    const handleSort = (key: string, direction?: 'asc' | 'desc') => {
        const newDirection = direction ?? ((sortConfig?.key === key && sortConfig.direction === 'asc') ? 'desc' : 'asc');
        addTransformation({ type: 'sort', payload: { key, direction: newDirection } });
        setPage(0);
        setContextMenu(null);
    };

    const handleHideColumn = (key: string) => {
        addTransformation({ type: 'hide_columns', payload: { columns: [key] } });
        setContextMenu(null);
    };
    
    const handleRenameColumn = (oldName: string) => {
        setContextMenu(null);
        const newName = prompt(`Rename column "${oldName}" to:`, oldName);
        if (newName && newName.trim() && newName !== oldName) {
            addTransformation({ type: 'rename_column', payload: { oldName, newName } });
        }
    };

    const handleTextTransform = (column: string, transformType: 'uppercase' | 'lowercase' | 'capitalize') => {
        addTransformation({ type: 'transform_text', payload: { column, transformType } });
        setContextMenu(null);
    };
    
    const handleQuickCalc = (column: string, op: 'sum' | 'average' | 'count') => {
        setContextMenu(null);
        if (columnTypes[column] !== 'number') {
            alert(`Calculation can only be performed on number columns.`);
            return;
        }
        const values = transformedData.map(row => Number(row[column])).filter(n => !isNaN(n));
        if (values.length === 0) { alert('No valid numbers to calculate.'); return; }

        let result: number;
        switch (op) {
            case 'sum': result = values.reduce((a, b) => a + b, 0); break;
            case 'average': result = values.reduce((a, b) => a + b, 0) / values.length; break;
            case 'count': result = values.length; break;
        }
        alert(`Quick Calculation Result:\n${op.charAt(0).toUpperCase() + op.slice(1)} of ${column}: ${result.toLocaleString()}`);
    };

    const handleMenuOpen = (e: React.MouseEvent, h: string) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu({ x: rect.left, y: rect.bottom + 4, column: h, columnType: columnTypes[h] });
    };
    
    const visibleHeaders = useMemo(() => columnsAfterTransform.filter(h => !hiddenColumnsSet.has(h)), [columnsAfterTransform, hiddenColumnsSet]);
    const totalPages = Math.ceil(transformedData.length / ROWS_PER_PAGE);
    const paginatedData = transformedData.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

    const commonModals = (
        <>
            {isChooseColumnsModalOpen && <ChooseColumnsModal allColumns={columnsAfterTransform} hiddenColumns={hiddenColumnsSet} onClose={() => setIsChooseColumnsModalOpen(false)} onApply={(colsToHide) => addTransformation({ type: 'hide_columns', payload: { columns: colsToHide } })} />}
            {isFilterModalOpen && <FilterRowsModal columns={columnsAfterTransform} onClose={() => setFilterModalOpen(false)} onApply={(filter) => addTransformation(filter)} />}
            {isAddColumnModalOpen && <AddColumnModal columns={columnsAfterTransform} onClose={() => setAddColumnModalOpen(false)} onApply={(newColumn) => addTransformation(newColumn)} />}
            {isGroupByModalOpen && <GroupByModal columns={columnsAfterTransform} onClose={() => setGroupByModalOpen(false)} onApply={(grouping) => addTransformation(grouping)} />}
        </>
    );

    const FullscreenHeader = () => (
        <header className="px-4 py-2 bg-white border-b border-slate-200 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
                <button onClick={() => setIsFsLeftPanelOpen(p => !p)} title="Toggle Applied Steps" className={`p-2 rounded-md hover:bg-slate-100 ${isFsLeftPanelOpen ? 'bg-primary-50 text-primary-600' : 'text-slate-500'}`}><PanelLeft size={16}/></button>
                <h3 className="font-semibold text-slate-900">Data Canvas (Fullscreen)</h3>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-500">{page * ROWS_PER_PAGE + 1}-{Math.min((page + 1) * ROWS_PER_PAGE, transformedData.length)} of {transformedData.length}</div>
                <div className="flex items-center space-x-1">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50 text-slate-500"><ChevronLeft size={16} /></button>
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50 text-slate-500"><ChevronRight size={16} /></button>
                </div>
            </div>
             <div className="flex items-center gap-2">
                 <button onClick={() => setIsFsRightPanelOpen(p => !p)} title="Toggle Ask AI" className={`p-2 rounded-md hover:bg-slate-100 ${isFsRightPanelOpen ? 'bg-primary-50 text-primary-600' : 'text-slate-500'}`}><PanelRight size={16}/></button>
                 <button onClick={() => setIsFullscreen(false)} title="Exit Fullscreen" className="p-2 rounded-md hover:bg-slate-100 text-slate-500"><Minimize size={16} /></button>
             </div>
        </header>
    );

    if (isFullscreen) {
        return (
            // This top-level wrapper creates the stacking context for the entire fullscreen experience.
            <div className="fixed inset-0 z-[100000]">
                {commonModals}
                <ColumnContextMenu menuState={contextMenu} onClose={() => setContextMenu(null)} onSort={handleSort} onHide={handleHideColumn} onRename={handleRenameColumn} onTextTransform={handleTextTransform} onQuickCalc={handleQuickCalc} onFilter={() => setFilterModalOpen(true)} />

                {/* This div is the actual fullscreen UI, with a lower z-index to sit behind modals */}
                <div className="absolute inset-0 z-[-1] bg-slate-100 flex flex-col">
                    <FullscreenHeader />
                    <div className="flex-1 flex p-2 gap-2 min-h-0">
                        <aside className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isFsLeftPanelOpen ? 'w-64' : 'w-0 opacity-0'}`}>
                           {isFsLeftPanelOpen && <AppliedStepsPanel transformations={transformations} isGrouped={isGrouped} onAddColumn={() => setAddColumnModalOpen(true)} onChooseColumns={() => setIsChooseColumnsModalOpen(true)} onFilterRows={() => setFilterModalOpen(true)} onGroupBy={() => setGroupByModalOpen(true)} onRemoveTransformation={removeTransformation} />}
                        </aside>
                        <main className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <DataTable headers={visibleHeaders} data={paginatedData} sortConfig={sortConfig} filteredColumns={filteredColumnsSet} onSort={handleSort} onMenuOpen={handleMenuOpen} />
                        </main>
                        <aside className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isFsRightPanelOpen ? 'w-80' : 'w-0 opacity-0'}`}>
                            {isFsRightPanelOpen && <AskAI data={transformedData} />}
                        </aside>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {createPortal(
                <>
                    {commonModals}
                    <ColumnContextMenu menuState={contextMenu} onClose={() => setContextMenu(null)} onSort={handleSort} onHide={handleHideColumn} onRename={handleRenameColumn} onTextTransform={handleTextTransform} onQuickCalc={handleQuickCalc} onFilter={() => setFilterModalOpen(true)} />
                </>,
                document.body
            )}
            
            <div className="flex h-full w-full bg-slate-100/50">
                <aside className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isLeftPanelOpen ? 'w-64' : 'w-0 opacity-0'}`}>
                    <AppliedStepsPanel transformations={transformations} isGrouped={isGrouped} onAddColumn={() => setAddColumnModalOpen(true)} onChooseColumns={() => setIsChooseColumnsModalOpen(true)} onFilterRows={() => setFilterModalOpen(true)} onGroupBy={() => setGroupByModalOpen(true)} onRemoveTransformation={removeTransformation} />
                </aside>

                <main className="flex-1 flex flex-col min-w-0 relative px-2">
                    <button onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)} title={isLeftPanelOpen ? "Collapse" : "Expand"} className="absolute top-1/2 -translate-y-1/2 -left-1 z-20 p-1.5 rounded-full bg-white border border-slate-300 text-slate-500 hover:bg-slate-100"><ChevronsLeft size={16} className={`transition-transform duration-300 ${!isLeftPanelOpen && 'rotate-180'}`} /></button>
                    
                    <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                        <header className="px-5 py-3 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                            <h3 className="font-semibold text-slate-900">Data Canvas</h3>
                            <div className="flex items-center space-x-4">
                                <div className="text-sm text-slate-500">{page * ROWS_PER_PAGE + 1}-{Math.min((page + 1) * ROWS_PER_PAGE, transformedData.length)} of {transformedData.length}</div>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50 text-slate-500"><ChevronLeft size={16} /></button>
                                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50 text-slate-500"><ChevronRight size={16} /></button>
                                </div>
                                <button onClick={() => setIsFullscreen(true)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"><Maximize size={16} /></button>
                            </div>
                        </header>
                        <DataTable headers={visibleHeaders} data={paginatedData} sortConfig={sortConfig} filteredColumns={filteredColumnsSet} onSort={handleSort} onMenuOpen={handleMenuOpen} />
                    </div>
                    <button onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} title={isRightPanelOpen ? "Collapse" : "Expand"} className="absolute top-1/2 -translate-y-1/2 -right-1 z-20 p-1.5 rounded-full bg-white border border-slate-300 text-slate-500 hover:bg-slate-100"><ChevronsRight size={16} className={`transition-transform duration-300 ${isRightPanelOpen && 'rotate-180'}`} /></button>
                </main>
                
                <aside className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isRightPanelOpen ? 'w-80' : 'w-0 opacity-0'}`}>
                    <AskAI data={transformedData} />
                </aside>
            </div>
        </>
    );
};

export default DataStudio;