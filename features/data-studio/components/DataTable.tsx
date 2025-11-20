
import React, { useRef } from 'react';
import { DataRow } from '../../../types.ts';
import { ArrowUp, ArrowDown, Filter as FilterIcon, MoreVertical } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

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

    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 45, // Approximate height of a row
        overscan: 20, // Render extra rows to prevent blank space during fast scrolling
    });

    // CSS Grid column definition
    const gridTemplateColumns = `repeat(${headers.length}, minmax(150px, 1fr))`;

    return (
        <div 
            ref={parentRef} 
            className="flex-1 overflow-auto custom-scrollbar relative bg-white h-full"
        >
            {/* Sticky Header inside the scroll container ensures horizontal sync */}
            <div 
                className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 grid font-medium text-slate-600 uppercase tracking-wider text-xs"
                style={{ gridTemplateColumns, minWidth: '100%' }}
            >
                {headers.map(h => (
                    <div key={h} className="px-4 py-3 whitespace-nowrap group border-r border-slate-100 last:border-r-0 flex items-center justify-between hover:bg-slate-100 transition-colors">
                        <button onClick={() => onSort(h)} className="flex items-center w-full text-left truncate focus:outline-none">
                            <span className="truncate" title={h}>{h}</span>
                            {sortConfig?.key === h && (
                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-2 flex-shrink-0 text-primary-600" /> : <ArrowDown size={14} className="ml-2 flex-shrink-0 text-primary-600" />
                            )}
                            {filteredColumns.has(h) && <FilterIcon size={12} className="ml-2 text-primary-600 flex-shrink-0" />}
                        </button>
                        <button 
                            onClick={(e) => onMenuOpen(e, h)} 
                            className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-slate-200 flex-shrink-0 transition-opacity"
                        >
                            <MoreVertical size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Virtualized Body */}
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = data[virtualRow.index];
                    return (
                        <div
                            key={virtualRow.index}
                            className="grid hover:bg-blue-50/30 border-b border-slate-100 transition-colors absolute top-0 left-0 w-full"
                            style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                                gridTemplateColumns
                            }}
                        >
                            {headers.map((h) => (
                                <div 
                                    key={`${virtualRow.index}-${h}`} 
                                    className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap truncate border-r border-slate-50 last:border-r-0 flex items-center"
                                    title={String(row[h])}
                                >
                                    {row[h] !== null && row[h] !== undefined && String(row[h]).trim() !== '' 
                                        ? String(row[h]) 
                                        : <span className="text-slate-300 italic text-xs">null</span>
                                    }
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
            
            {data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <p>No data available.</p>
                </div>
            )}
        </div>
    );
};
