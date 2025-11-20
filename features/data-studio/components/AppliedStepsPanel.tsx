
import React from 'react';
import { Transformation } from '../../../types.ts';
import { PlusCircle, Columns, Filter as FilterIcon, BarChart3, Settings, X } from 'lucide-react';
import { Button } from '../../../components/ui/index.ts';

export const getTransformationDescription = (t: Transformation): string => {
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

interface Props {
    transformations: Transformation[];
    isGrouped: boolean;
    onAddColumn: () => void;
    onChooseColumns: () => void;
    onFilterRows: () => void;
    onGroupBy: () => void;
    onRemoveTransformation: (index: number) => void;
}

export const AppliedStepsPanel: React.FC<Props> = ({
    transformations,
    isGrouped,
    onAddColumn,
    onChooseColumns,
    onFilterRows,
    onGroupBy,
    onRemoveTransformation
}) => (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm">
        <header className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <h3 className="font-semibold text-slate-900">Applied Steps</h3>
        </header>
        <div className="flex-shrink-0 p-3 space-y-2 border-b border-slate-100">
            <Button onClick={onAddColumn} disabled={isGrouped} variant="secondary" size="sm" icon={PlusCircle} className="w-full justify-center">Add Column</Button>
            <Button onClick={onChooseColumns} disabled={isGrouped} variant="secondary" size="sm" icon={Columns} className="w-full justify-center">Choose Columns</Button>
            <Button onClick={onFilterRows} disabled={isGrouped} variant="secondary" size="sm" icon={FilterIcon} className="w-full justify-center">Filter Rows</Button>
            <Button onClick={onGroupBy} disabled={isGrouped} variant="secondary" size="sm" icon={BarChart3} className="w-full justify-center">Group By</Button>
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
