import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Project, DataRow, Transformation, SortTransformation } from '../../types.ts';
import { 
    ChevronLeft, ChevronRight, Maximize, Minimize, ChevronsLeft, ChevronsRight, PanelLeft, PanelRight, Loader2
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
    
    // Worker State
    const [transformedData, setTransformedData] = useState<DataRow[]>(project.dataSource.data);
    const [isCalculating, setIsCalculating] = useState(false);
    const workerRef = useRef<Worker | null>(null);

    const transformations = project.transformations || [];
    const originalData = project.dataSource.data;
    const isGrouped = useMemo(() => transformations.some(t => t.type === 'group_by'), [transformations]);

    useEffect(() => {
        workerRef.current = new Worker(new URL('../../services/calculator.worker.ts', import.meta.url));
        workerRef.current.onmessage = (e) => {
            const { type, result, message } = e.data;
            if (type === 'success') {
                setTransformedData(result);
                setIsCalculating(false);
            } else if (type === 'error') {
                console.error('Worker calculation error:', message);
                setIsCalculating(false);
            }
        };
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    useEffect(() => {
        if (workerRef.current) {
            setIsCalculating(true);
            workerRef.current.postMessage({ data: originalData, transformations });
        }
    }, [originalData, transformations]);

    const columnsAfterTransform = useMemo(() => {
        return transformedData.length > 0 ? Object.keys(transformedData[0]) : [];
    }, [transformedData]);
    
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
                {isCalculating && <span className="text-xs text-primary-600 flex items-center"><Loader2 size={12} className="animate-spin mr-1"/> Calculating...</span>}
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
            <div className="fixed inset-0 z-[100000]">
                {commonModals}
                <ColumnContextMenu menuState={contextMenu} onClose={() => setContextMenu(null)} onSort={handleSort} onHide={handleHideColumn} onRename={handleRenameColumn} onTextTransform={handleTextTransform} onQuickCalc={handleQuickCalc} onFilter={() => setFilterModalOpen(true)} />

                <div className="absolute inset-0 z-[-1] bg-slate-100 flex flex-col">
                    <FullscreenHeader />
                    <div className="flex-1 flex p-2 gap-2 min-h-0">
                        <aside className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isFsLeftPanelOpen ? 'w-64' : 'w-0 opacity-0'}`}>
                           {isFsLeftPanelOpen && <AppliedStepsPanel transformations={transformations} isGrouped={isGrouped} onAddColumn={() => setAddColumnModalOpen(true)} onChooseColumns={() => setIsChooseColumnsModalOpen(true)} onFilterRows={() => setFilterModalOpen(true)} onGroupBy={() => setGroupByModalOpen(true)} onRemoveTransformation={removeTransformation} />}
                        </aside>
                        <main className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                            {isCalculating && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={32}/></div>}
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
                                {isCalculating && <span className="text-xs text-primary-600 flex items-center"><Loader2 size={12} className="animate-spin mr-1"/> Calculating...</span>}
                                <div className="text-sm text-slate-500">{page * ROWS_PER_PAGE + 1}-{Math.min((page + 1) * ROWS_PER_PAGE, transformedData.length)} of {transformedData.length}</div>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50 text-slate-500"><ChevronLeft size={16} /></button>
                                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50 text-slate-500"><ChevronRight size={16} /></button>
                                </div>
                                <button onClick={() => setIsFullscreen(true)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"><Maximize size={16} /></button>
                            </div>
                        </header>
                        <div className="flex-1 relative overflow-hidden">
                             {isCalculating && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={32}/></div>}
                             <DataTable headers={visibleHeaders} data={paginatedData} sortConfig={sortConfig} filteredColumns={filteredColumnsSet} onSort={handleSort} onMenuOpen={handleMenuOpen} />
                        </div>
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
