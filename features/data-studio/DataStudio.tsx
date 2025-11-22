
import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Project, DataRow, Transformation, SortTransformation } from '../../types.ts';
import { 
    ChevronLeft, ChevronRight, Maximize, Minimize, ChevronsLeft, ChevronsRight, PanelLeft, PanelRight
} from 'lucide-react';
import { ChooseColumnsModal } from '../../components/modals/ChooseColumnsModal.tsx';
import { FilterRowsModal } from './components/modals/FilterRowsModal.tsx';
import { AddColumnModal } from './components/modals/AddColumnModal.tsx';
import { GroupByModal } from './components/modals/GroupByModal.tsx';

import { AppliedStepsPanel } from './components/AppliedStepsPanel.tsx';
import { AskAI } from './components/AskAI.tsx';
import { ColumnContextMenu, ContextMenuState } from './components/ColumnContextMenu.tsx';
import { DataTable } from './components/DataTable.tsx';

interface Props {
  project: Project;
  onProjectUpdate: (updater: (prev: Project) => Project) => void;
}

const ROWS_PER_PAGE = 50;

// --- UTILS ---

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

const detectColumnType = (data: DataRow[], columnName: string): 'text' | 'number' | 'date' => {
    const sample = data.slice(0, 100).map(row => row[columnName]).filter(val => val !== null && val !== undefined && val !== '');
    if (sample.length === 0) return 'text';

    const allNumbers = sample.every(val => !isNaN(Number(val)) && String(val).trim() !== '');
    if (allNumbers) return 'number';

    const allDates = sample.every(val => typeof val === 'string' && !isNaN(Date.parse(val)) && isNaN(Number(val)));
    if (allDates) return 'date';
    
    return 'text';
};


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
