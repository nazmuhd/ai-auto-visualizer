
import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { ChartConfig, DataRow, ChartType, TimeGrain } from '../../types.ts';
import { RechartsBarChart } from './RechartsBarChart.tsx';
import { RechartsLineChart } from './RechartsLineChart.tsx';
import { RechartsPieChart } from './RechartsPieChart.tsx';
import { RechartsScatterChart } from './RechartsScatterChart.tsx';
import { RechartsComboChart } from './RechartsComboChart.tsx';
import { MoreVertical, Edit3, PieChart, BarChart, LineChart, ScatterChart, AreaChart, Download, Grid, List, Tag, Calendar, ChevronRight, Image as ImageIcon, Palette, Maximize, Filter, Check } from 'lucide-react';
import { lttb } from '../../utils/sampling.ts';

// Types and constants...
export type TimeFilterPreset = 'all' | '7d' | '30d' | '90d' | 'ytd' | 'custom';
export interface ViewOptions { showGrid: boolean; showLegend: boolean; showLabels: boolean; }
const PALETTES: Record<string, string[]> = { 'Default': ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1'], 'Ocean Blues': ['#0369a1', '#0ea5e9', '#7dd3fc', '#e0f2fe', '#083344', '#38bdf8'], 'Sunset': ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ea580c', '#c2410c'], 'Forest': ['#166534', '#22c55e', '#86efac', '#dcfce7', '#15803d', '#14532d'] };

interface Props {
    config: ChartConfig;
    data: DataRow[];
    dateColumn: string | null;
    allData: DataRow[];
    onUpdate?: (newConfig: ChartConfig) => void;
    onMaximize?: (config: ChartConfig) => void;
    enableScrollZoom?: boolean;
    onFilterChange: (column: string, values: Set<string>) => void;
    onTimeFilterChange: (filter: { type: TimeFilterPreset; start?: string; end?: string }) => void;
    activeFilters: Record<string, Set<string>>;
    activeTimeFilter: { type: TimeFilterPreset; start?: string; end?: string };
}

const ChartRendererComponent: React.FC<Props> = ({ config, data, allData, dateColumn, onUpdate, onMaximize, enableScrollZoom = false, onFilterChange, onTimeFilterChange, activeFilters, activeTimeFilter }) => {
    // ... (UI State: isMenuOpen, viewOptions, etc.)
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [viewOptions, setViewOptions] = useState<ViewOptions>({ showGrid: config.type !== 'pie', showLegend: true, showLabels: true });
    const [timeGrain, setTimeGrain] = useState<TimeGrain>('daily');
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // ... (Event Handlers: click outside, etc.)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) { setIsMenuOpen(false); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- OPTIMIZATION: Data Sampling ---
    const optimizedData = useMemo(() => {
        // Only downsample for continuous charts (Line, Area, Scatter) with many points
        if (['line', 'area', 'scatter', 'bubble'].includes(config.type) && data.length > 500) {
            // Use LTTB with a threshold of 300 points for rendering
            return lttb(data, 300, config.mapping.x, config.mapping.y);
        }
        return data;
    }, [data, config.type, config.mapping.x, config.mapping.y]);

    const formatColumnName = (name: string) => name.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();

    const renderChart = () => {
        const commonProps = { data: optimizedData, mapping: config.mapping, viewOptions, colors: config.colors || PALETTES['Default'], formatLabel: formatColumnName };
        switch (config.type) {
            case 'bar': return <RechartsBarChart {...commonProps} />;
            case 'stacked-bar': return <RechartsBarChart {...commonProps} isStacked={true} />;
            case 'line': return <RechartsLineChart {...commonProps} timeGrain={timeGrain} enableScrollZoom={enableScrollZoom} />;
            case 'area': return <RechartsLineChart {...commonProps} isArea={true} timeGrain={timeGrain} enableScrollZoom={enableScrollZoom} />;
            case 'pie': return <RechartsPieChart {...commonProps} />;
            case 'scatter': return <RechartsScatterChart {...commonProps} enableScrollZoom={enableScrollZoom} />;
            case 'bubble': return <RechartsScatterChart {...commonProps} isBubble={true} enableScrollZoom={enableScrollZoom} />;
            case 'combo': return <RechartsComboChart {...commonProps} />;
            default: return <div>Unsupported</div>;
        }
    };

    // Minimal render structure for brevity, integrating new Optimization logic
    return (
        <div className="flex flex-col h-full w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300 relative group">
            <div className="px-6 pt-5 pb-0 flex justify-between items-start relative z-10 flex-shrink-0">
                <div className="flex-1 pr-8">
                    <h3 className="text-lg font-semibold text-slate-900 leading-tight">{config.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2" title={config.description}>{config.description}</p>
                </div>
                <div className="flex items-center space-x-1">
                    {onMaximize && (
                        <button onClick={() => onMaximize(config)} className='p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all'>
                            <Maximize size={16} />
                        </button>
                    )}
                    {onUpdate && (
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"><MoreVertical size={20}/></button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                                    {/* Menu items simplified */}
                                    <button className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50">Edit Chart</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
                 <div className="flex-shrink-0 flex justify-center items-center space-x-1 py-2 mt-4">
                    {config.type !== 'pie' && <button onClick={() => setViewOptions(p => ({...p, showGrid: !p.showGrid}))} className={`p-1 ${viewOptions.showGrid ? 'text-primary-600' : 'text-slate-400'}`}><Grid size={14}/></button>}
                    <button onClick={() => setViewOptions(p => ({...p, showLegend: !p.showLegend}))} className={`p-1 ${viewOptions.showLegend ? 'text-primary-600' : 'text-slate-400'}`}><List size={14}/></button>
                 </div>
                 <div ref={chartContainerRef} className="flex-1 px-4 pb-4 min-h-0 relative z-0">
                    {optimizedData.length > 0 ? renderChart() : <div className="flex items-center justify-center h-full text-slate-500">No data</div>}
                </div>
            </div>
        </div>
    );
};

export const ChartRenderer = memo(ChartRendererComponent);
