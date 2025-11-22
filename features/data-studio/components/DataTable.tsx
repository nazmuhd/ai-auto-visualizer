
import React, { useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { DataRow } from '../../../types.ts';
import { ArrowUp, ArrowDown, Filter as FilterIcon, MoreVertical } from 'lucide-react';

interface Props {
    headers: string[];
    data: DataRow[];
    sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
    filteredColumns: Set<string>;
    onSort: (key: string) => void;
    onMenuOpen: (e: React.MouseEvent, h: string) => void;
}

export const DataTable: React.FC<Props> = ({ headers, data, sortConfig, filteredColumns, onSort, onMenuOpen }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        if (!parentRef.current) return;
        const resizeObserver = new ResizeObserver(() => {
            if (parentRef.current) {
                setDimensions({
                    width: parentRef.current.offsetWidth,
                    height: parentRef.current.offsetHeight
                });
            }
        });
        resizeObserver.observe(parentRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Column width logic (simple estimation)
    const getColWidth = (header: string) => Math.max(120, header.length * 12);
    const totalRowWidth = headers.reduce((sum, h) => sum + getColWidth(h) + 32, 0); // 32px padding

    const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
        const row = data[index];
        return (
            <div style={style} className="flex border-b border-slate-100 hover:bg-slate-50">
                {headers.map(h => (
                    <div 
                        key={`${index}-${h}`} 
                        className="px-4 py-3 text-slate-600 whitespace-nowrap truncate border-r border-transparent hover:border-slate-200 transition-colors text-sm"
                        style={{ width: getColWidth(h) + 32, flexShrink: 0 }}
                        title={String(row[h] ?? '')}
                    >
                        {String(row[h] ?? '').trim() ? String(row[h]) : <em className="text-slate-400">null</em>}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Sticky Header */}
            <div className="flex bg-slate-50 border-b border-slate-200 overflow-hidden flex-shrink-0" style={{ width: dimensions.width }}>
                <div className="flex">
                    {headers.map(h => (
                        <div 
                            key={h} 
                            className="px-4 py-2.5 font-medium text-slate-600 uppercase tracking-wider text-xs whitespace-nowrap group flex items-center justify-between border-r border-slate-200/50"
                            style={{ width: getColWidth(h) + 32, flexShrink: 0 }}
                        >
                            <button onClick={() => onSort(h)} className="flex items-center truncate hover:text-slate-900">
                                {h}
                                {sortConfig?.key === h && (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-2" /> : <ArrowDown size={14} className="ml-2" />)}
                                {filteredColumns.has(h) && <FilterIcon size={12} className="ml-2 text-primary-600" />}
                            </button>
                            <button onClick={(e) => onMenuOpen(e, h)} className="ml-2 p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-slate-200">
                                <MoreVertical size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Virtualized Body */}
            <div className="flex-1" ref={parentRef}>
                <List
                    height={dimensions.height - 40} // Subtract header height roughly
                    itemCount={data.length}
                    itemSize={40} // Row height
                    width={dimensions.width}
                >
                    {Row}
                </List>
            </div>
        </div>
    );
};
