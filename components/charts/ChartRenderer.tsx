import React, { Suspense, useState, useRef, useEffect, useMemo } from 'react';
import { ChartConfig, DataRow, ChartType } from '../../types';
import { RechartsBarChart } from './RechartsBarChart';
import { RechartsLineChart } from './RechartsLineChart';
import { RechartsPieChart } from './RechartsPieChart';
import { RechartsScatterChart } from './RechartsScatterChart';
import { Loader2, MoreVertical, Edit3, PieChart, BarChart, LineChart, ScatterChart, AreaChart, Info, X, Download, Grid, List, Tag, Calendar, ChevronDown, Filter, Check, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface Props {
    config: ChartConfig;
    data: DataRow[];
    dateColumn: string | null;
    onUpdate?: (newConfig: ChartConfig) => void;
}

export interface ViewOptions {
    showGrid: boolean;
    showLegend: boolean;
    showLabels: boolean;
}

type TimeFilterPreset = 'all' | '7d' | '30d' | '90d' | 'ytd' | 'custom';

export const ChartRenderer: React.FC<Props> = ({ config, data, dateColumn, onUpdate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Track which submenu section is expanded in the 3-dot menu
    const [expandedMenuSection, setExpandedMenuSection] = useState<string | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    // --- View Controls State ---
    const [viewOptions, setViewOptions] = useState<ViewOptions>({
        showGrid: config.type !== 'pie',
        showLegend: !!config.mapping.color || config.type === 'pie',
        showLabels: false
    });

    // --- Time Filtering State ---
    const [timeFilter, setTimeFilter] = useState<{ type: TimeFilterPreset; start: string; end: string }>({
        type: 'all',
        start: '',
        end: ''
    });

    // --- Categorical Filtering State ---
    const [activeCategoryFilters, setActiveCategoryFilters] = useState<Record<string, Set<string>>>({});

    // Edit form state
    const [editForm, setEditForm] = useState({
        title: config.title,
        description: config.description,
        type: config.type
    });

    // --- Click Outside Handlers ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
                setExpandedMenuSection(null); // Collapse submenus on close
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isEditModalOpen) {
            setEditForm({ title: config.title, description: config.description, type: config.type });
        }
    }, [isEditModalOpen, config]);

    // Reset view options on chart type change
    useEffect(() => {
        setViewOptions(prev => ({
            ...prev,
            showGrid: config.type !== 'pie' && prev.showGrid,
            showLegend: (!!config.mapping.color || config.type === 'pie') || prev.showLegend
        }));
    }, [config.type, config.mapping.color]);


    // --- 1. Detect Filterable Categorical Columns ---
    const filterableColumns = useMemo(() => {
        if (!data || data.length === 0) return [];
        const columns = Object.keys(data[0]);
        const candidates: { col: string; values: string[] }[] = [];
        const MAX_UNIQUE_VALUES = 20; // Keep cardinality low for dropdown menu

        columns.forEach(col => {
            // Don't filter by the primary metric column, usually not useful
            if (col === config.mapping.y) return;

            // Quick sample to check cardinality
            const uniqueValues = new Set(data.slice(0, 200).map(row => String(row[col] || '')));
            if (uniqueValues.size > 1 && uniqueValues.size <= MAX_UNIQUE_VALUES) {
                const fullUnique = Array.from<string>(new Set(data.map(row => String(row[col] || ''))))
                    .filter(v => v !== '' && v !== 'null' && v !== 'undefined' && v !== 'NaN');
                
                if (fullUnique.length <= MAX_UNIQUE_VALUES) {
                     candidates.push({ col, values: fullUnique.sort() });
                }
            }
        });
        // Limit to top 3 most likely categorical columns to keep menu manageable
        return candidates.slice(0, 3);
    }, [data, config.mapping.y]);


    // --- 2. Unified Data Filtering Logic ---
    const filteredData = useMemo(() => {
        if (!data) return [];
        let result = data;

        // A. Apply Time Filter
        if (dateColumn && timeFilter.type !== 'all') {
            const now = new Date();
            let startDate: Date | null = null;
            let endDate: Date | null = null;

            switch (timeFilter.type) {
                case '7d': startDate = new Date(); startDate.setDate(now.getDate() - 7); break;
                case '30d': startDate = new Date(); startDate.setDate(now.getDate() - 30); break;
                case '90d': startDate = new Date(); startDate.setDate(now.getDate() - 90); break;
                case 'ytd': startDate = new Date(now.getFullYear(), 0, 1); break;
                case 'custom':
                    if (timeFilter.start) startDate = new Date(timeFilter.start);
                    if (timeFilter.end) {
                        endDate = new Date(timeFilter.end);
                        endDate.setHours(23, 59, 59, 999);
                    }
                    break;
            }

            result = result.filter(row => {
                const rowDateStr = row[dateColumn];
                if (!rowDateStr) return false;
                const rowDate = new Date(rowDateStr);
                if (isNaN(rowDate.getTime())) return false;
                if (startDate && rowDate < startDate) return false;
                if (endDate && rowDate > endDate) return false;
                return true;
            });
        }

        // B. Apply Categorical Filters
        Object.entries(activeCategoryFilters).forEach(([col, allowedValues]) => {
            const valSet = allowedValues as Set<string>;
            if (valSet.size > 0) {
                result = result.filter(row => valSet.has(String(row[col])));
            }
        });

        return result;
    }, [data, dateColumn, timeFilter, activeCategoryFilters]);


    // --- Handlers ---
    const toggleCategoryFilter = (col: string, val: string) => {
        setActiveCategoryFilters(prev => {
            const currentSet = new Set(prev[col] || []);
            if (currentSet.has(val)) {
                currentSet.delete(val);
            } else {
                currentSet.add(val);
            }
            return { ...prev, [col]: currentSet };
        });
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onUpdate) onUpdate({ ...config, ...editForm });
        setIsEditModalOpen(false);
        setIsMenuOpen(false);
    };
    
    const handleExportPNG = () => {
        const svgElement = chartContainerRef.current?.querySelector('svg');
        if (!svgElement) return;

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 2; // Render at 2x resolution for better quality
            canvas.width = svgElement.clientWidth * scale;
            canvas.height = svgElement.clientHeight * scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `${config.title.replace(/\s+/g, '_').toLowerCase()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
        setIsMenuOpen(false);
    };

    const handleDownloadCSV = () => {
        if (!filteredData || filteredData.length === 0) return;
        const headers = Object.keys(filteredData[0]);
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => headers.map(fieldName => JSON.stringify(row[fieldName] ?? '')).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${config.title.replace(/\s+/g, '_').toLowerCase()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsMenuOpen(false);
    };

    // Smart Template Matching
    const availableChartTypes = useMemo(() => {
        if (!data || data.length === 0) return [];
        const sample = data[0];
        const xVal = sample[config.mapping.x];
        const yVal = sample[config.mapping.y];
        const isXNumeric = !isNaN(Number(xVal));
        const isYNumeric = !isNaN(Number(yVal));
        const isXDate = !isNaN(Date.parse(xVal)) && isNaN(Number(xVal)); 

        const types: { type: ChartType, label: string, icon: React.ElementType, recommended: boolean }[] = [
            { type: 'bar', label: 'Bar Chart', icon: BarChart, recommended: true },
        ];
        if (isYNumeric) types.push({ type: 'pie', label: 'Pie Chart', icon: PieChart, recommended: !isXNumeric && !isXDate });
        if (isXDate || isXNumeric) {
             types.push({ type: 'line', label: 'Line Chart', icon: LineChart, recommended: true });
             types.push({ type: 'area', label: 'Area Chart', icon: AreaChart, recommended: true });
        } else {
             types.push({ type: 'line', label: 'Line Chart', icon: LineChart, recommended: false });
        }
        if (isXNumeric && isYNumeric) types.push({ type: 'scatter', label: 'Scatter Plot', icon: ScatterChart, recommended: true });

        return types.filter(t => t.type !== config.type);
    }, [data, config.mapping, config.type]);


    const renderChart = () => {
        const commonProps = { data: filteredData, mapping: config.mapping, viewOptions };
        switch (config.type) {
            case 'bar': return <RechartsBarChart {...commonProps} />;
            case 'line': return <RechartsLineChart {...commonProps} />;
            case 'area': return <RechartsLineChart {...commonProps} isArea={true} />;
            case 'pie': return <RechartsPieChart {...commonProps} />;
            case 'scatter': return <RechartsScatterChart {...commonProps} />;
            default: return null;
        }
    };

    const ToggleButton = ({ icon: Icon, label, isActive, onClick }: { icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }) => (
        <button 
            onClick={onClick}
            title={label}
            className={`p-1.5 rounded-md transition-all duration-200 flex items-center space-x-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
        >
            <Icon size={14} />
            <span className="text-[11px] font-medium">{label}</span>
        </button>
    );

    const hasActiveFilters = timeFilter.type !== 'all' || Object.values(activeCategoryFilters).some((s) => (s as Set<string>).size > 0);

    return (
        <>
            <div className="flex flex-col h-full w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-visible hover:shadow-md transition-all duration-300 relative group">
                {/* Header */}
                <div className="px-6 pt-5 pb-3 flex justify-between items-start relative z-10">
                    <div className="flex-1 pr-8">
                        <h3 className="text-lg font-semibold text-slate-900 leading-tight">{config.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2" title={config.description}>{config.description}</p>
                    </div>
                    {onUpdate && (
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-1.5 rounded-full transition-colors ${isMenuOpen || hasActiveFilters ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 focus:opacity-100'}`}>
                                <MoreVertical size={20} />
                                {hasActiveFilters && !isMenuOpen && (
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary-500 border-2 border-white rounded-full"></span>
                                )}
                            </button>
                            
                            {/* --- 3-DOT DROPDOWN MENU --- */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right max-h-[80vh] overflow-y-auto custom-scrollbar">
                                    
                                    <button onClick={() => setIsEditModalOpen(true)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center transition-colors">
                                        <Edit3 size={16} className="mr-3 text-slate-400" /> Edit Title & Description
                                    </button>
                                    
                                    <button onClick={handleExportPNG} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center transition-colors">
                                        <ImageIcon size={16} className="mr-3 text-slate-400" /> Export as PNG
                                    </button>

                                    <button onClick={handleDownloadCSV} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center transition-colors">
                                        <Download size={16} className="mr-3 text-slate-400" /> Export CSV Data
                                    </button>

                                    {/* --- FILTER SECTION --- */}
                                    {(dateColumn || filterableColumns.length > 0) && (
                                        <>
                                            <div className="my-2 border-t border-slate-100" />
                                            <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                                <span>Filter Data</span>
                                                {hasActiveFilters && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTimeFilter({ type: 'all', start: '', end: '' });
                                                            setActiveCategoryFilters({});
                                                        }}
                                                        className="text-[10px] text-primary-600 hover:text-primary-700"
                                                    >
                                                        Clear All
                                                    </button>
                                                )}
                                            </div>

                                            {/* 1. Time Filter Submenu */}
                                            {dateColumn && (
                                                <div>
                                                    <button 
                                                        onClick={() => setExpandedMenuSection(expandedMenuSection === 'time' ? null : 'time')}
                                                        className={`w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between ${timeFilter.type !== 'all' ? 'bg-primary-50/50' : ''}`}
                                                    >
                                                        <div className="flex items-center">
                                                            <Calendar size={16} className={`mr-3 ${timeFilter.type !== 'all' ? 'text-primary-600' : 'text-slate-400'}`} /> 
                                                            <span className={timeFilter.type !== 'all' ? 'font-medium text-primary-900' : ''}>
                                                                Time Period
                                                                {timeFilter.type !== 'all' && <span className="ml-2 text-xs opacity-70">({timeFilter.type === 'custom' ? 'Custom' : timeFilter.type.toUpperCase()})</span>}
                                                            </span>
                                                        </div>
                                                        <ChevronRight size={16} className={`text-slate-400 transition-transform ${expandedMenuSection === 'time' ? 'rotate-90' : ''}`} />
                                                    </button>
                                                    {expandedMenuSection === 'time' && (
                                                        <div className="bg-slate-50 px-4 py-3 border-y border-slate-100 space-y-3">
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {['all', '7d', '30d', '90d', 'ytd'].map((preset) => (
                                                                    <button
                                                                        key={preset}
                                                                        onClick={() => setTimeFilter({ type: preset as TimeFilterPreset, start: '', end: '' })}
                                                                        className={`px-2 py-1.5 text-xs font-medium rounded border transition-colors
                                                                            ${timeFilter.type === preset ? 'bg-primary-100 border-primary-300 text-primary-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}
                                                                        `}
                                                                    >
                                                                        {preset === 'all' ? 'All' : preset.toUpperCase()}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <input type="date" className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-primary-500" value={timeFilter.start} onChange={(e) => setTimeFilter({ type: 'custom', start: e.target.value, end: timeFilter.end })} />
                                                                <span className="text-slate-400">-</span>
                                                                <input type="date" className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-primary-500" value={timeFilter.end} onChange={(e) => setTimeFilter({ type: 'custom', start: timeFilter.start, end: e.target.value })} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* 2. Categorical Filter Submenus */}
                                            {filterableColumns.map((colData) => {
                                                const activeSet = activeCategoryFilters[colData.col] as Set<string> | undefined;
                                                const activeCount = activeSet?.size || 0;
                                                const isExpanded = expandedMenuSection === `cat_${colData.col}`;
                                                
                                                return (
                                                    <div key={colData.col}>
                                                         <button 
                                                            onClick={() => setExpandedMenuSection(isExpanded ? null : `cat_${colData.col}`)}
                                                            className={`w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between ${activeCount > 0 ? 'bg-primary-50/50' : ''}`}
                                                        >
                                                            <div className="flex items-center truncate mr-2">
                                                                <Filter size={16} className={`mr-3 flex-shrink-0 ${activeCount > 0 ? 'text-primary-600' : 'text-slate-400'}`} />
                                                                <span className={`truncate ${activeCount > 0 ? 'font-medium text-primary-900' : ''}`}>
                                                                    Filter by {colData.col}
                                                                </span>
                                                                {activeCount > 0 && (
                                                                    <span className="ml-2 bg-primary-100 text-primary-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                                        {activeCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <ChevronRight size={16} className={`text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                        </button>
                                                        {isExpanded && (
                                                            <div className="bg-slate-50 max-h-48 overflow-y-auto custom-scrollbar border-y border-slate-100">
                                                                {colData.values.map(val => {
                                                                    const isSelected = activeCategoryFilters[colData.col]?.has(val);
                                                                    return (
                                                                        <button
                                                                            key={val}
                                                                            onClick={(e) => { e.stopPropagation(); toggleCategoryFilter(colData.col, val); }}
                                                                            className={`w-full text-left px-8 py-2 text-xs flex items-center justify-between hover:bg-slate-100 ${isSelected ? 'text-primary-700 font-medium bg-primary-50/50' : 'text-slate-600'}`}
                                                                        >
                                                                            <span className="truncate mr-2">{val}</span>
                                                                            {isSelected && <Check size={14} className="text-primary-600" />}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}

                                    {/* --- TEMPLATES SECTION --- */}
                                    {availableChartTypes.length > 0 && (
                                        <>
                                            <div className="my-2 border-t border-slate-100" />
                                            <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Switch Chart Type</div>
                                            {availableChartTypes.map((item) => (
                                                <button key={item.type} onClick={() => onUpdate({...config, type: item.type})} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between group/item">
                                                    <div className="flex items-center"><item.icon size={16} className="mr-3 text-slate-400 group-hover/item:text-primary-500 transition-colors" /> {item.label}</div>
                                                    {item.recommended && <span className="text-[10px] font-medium bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">Smart Match</span>}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Chart Area */}
                <div ref={chartContainerRef} className="flex-1 p-4 min-h-[300px] relative z-0">
                    {/* Floating View Toggles - Fixed position relative to chart area, visible on hover */}
                    <div className="absolute top-2 right-4 z-20 flex items-center space-x-1 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                        {config.type !== 'pie' && (
                            <ToggleButton icon={Grid} label="Grid" isActive={viewOptions.showGrid} onClick={() => setViewOptions(p => ({ ...p, showGrid: !p.showGrid }))} />
                        )}
                        <ToggleButton icon={List} label="Legend" isActive={viewOptions.showLegend} onClick={() => setViewOptions(p => ({ ...p, showLegend: !p.showLegend }))} />
                        <ToggleButton icon={Tag} label="Values" isActive={viewOptions.showLabels} onClick={() => setViewOptions(p => ({ ...p, showLabels: !p.showLabels }))} />
                    </div>

                    <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10"><Loader2 className="animate-spin text-primary-500" size={32} /></div>}>
                        {renderChart()}
                    </Suspense>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 relative" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 pb-0 flex justify-between items-center">
                             <h3 className="text-xl font-bold text-slate-900">Edit Chart Metadata</h3>
                             <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Chart Title</label>
                                <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-slate-700">Insight Description</label>
                                    <Info size={14} className="text-slate-400" />
                                </div>
                                <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none h-32" required />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};