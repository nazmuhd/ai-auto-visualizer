
import React, { useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, CaseSensitive, ChevronRight, ArrowDown01, ArrowUp10, Sigma, CalendarDays, Filter as FilterIcon, EyeOff, Pencil } from 'lucide-react';

export interface ContextMenuState {
    x: number;
    y: number;
    column: string;
    columnType: 'text' | 'number' | 'date';
}

interface Props {
    menuState: ContextMenuState | null;
    onClose: () => void;
    onSort: (key: string, dir?: 'asc' | 'desc') => void;
    onHide: (key: string) => void;
    onRename: (key: string) => void;
    onTextTransform: (key: string, type: 'uppercase' | 'lowercase' | 'capitalize') => void;
    onQuickCalc: (key: string, op: 'sum' | 'average' | 'count') => void;
    onFilter: () => void;
}

export const ColumnContextMenu: React.FC<Props> = ({ menuState, onClose, onSort, onHide, onRename, onTextTransform, onQuickCalc, onFilter }) => {
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
