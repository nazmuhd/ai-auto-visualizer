import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { ChartConfig, DataRow, ChartType, TimeGrain } from '../../types.ts';
import { RechartsBarChart } from './RechartsBarChart.tsx';
import { RechartsLineChart } from './RechartsLineChart.tsx';
import { RechartsPieChart } from './RechartsPieChart.tsx';
import { RechartsScatterChart } from './RechartsScatterChart.tsx';
import { RechartsComboChart } from './RechartsComboChart.tsx';
import { Loader2, MoreVertical, Edit3, PieChart, BarChart, LineChart, ScatterChart, AreaChart, Info, X, Download, Grid, List, Tag, Calendar, ChevronDown, Filter, Check, ChevronRight, Image as ImageIcon, Palette, Maximize } from 'lucide-react';

export type TimeFilterPreset = 'all' | '7d' | '30d' | '90d' | 'ytd' | 'custom';

interface Props {
    config: ChartConfig;
    data: DataRow[];
    dateColumn: string | null;
    allData: DataRow[]; // Full unfiltered dataset for calculating filter options
    onUpdate?: (newConfig: ChartConfig) => void;
    onMaximize?: (config: ChartConfig) => void;
    enableScrollZoom?: boolean;
    onFilterChange: (column: string, values: Set<string>) => void;
    onTimeFilterChange: (filter: { type: TimeFilterPreset; start?: string; end?: string }) => void;
    activeFilters: Record<string, Set<string>>;
    activeTimeFilter: { type: TimeFilterPreset; start?: string; end?: string };
}

export interface ViewOptions {
    showGrid: boolean;
    showLegend: boolean;
    showLabels: boolean;
}

const formatColumnName = (name: string) => {
    if (!name || typeof name !== 'string') return '';
    return name
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/\b\w/g, char => char.toUpperCase());
};

const PALETTES: Record<string, string[]> = {
    'Default': ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1'],
    'Ocean Blues': ['#0369a1', '#0ea5e9', '#7dd3fc', '#e0f2fe', '#083344', '#38bdf8'],
    'Sunset': ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ea580c', '#c2410c'],
    'Forest': ['#166534', '#22c55e', '#86efac', '#dcfce7', '#15803d', '#14532d']
};

const CHART_TYPE_OPTIONS: { value: ChartType; label: string }[] = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'stacked-bar', label: 'Stacked Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'area', label: 'Area Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'scatter', label: 'Scatter Plot' },
    { value: 'bubble', label: 'Bubble Chart' },
    { value: 'combo', label: 'Combo Chart' },
];

const ControlWrapper: React.FC<{ label: string, children: React.ReactNode}> = ({ label, children }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        {children}
    </div>
);

const ChartRendererComponent: React.FC<Props> = ({ config, data, allData, dateColumn, onUpdate, onMaximize, enableScrollZoom = false, onFilterChange, onTimeFilterChange, activeFilters, activeTimeFilter }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const [expandedMenuGroup, setExpandedMenuGroup] = useState<string | null>(null);
    const [expandedFilterItem, setExpandedFilterItem] = useState<string | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    const [viewOptions, setViewOptions] = useState<ViewOptions>({
        showGrid: config.type !== 'pie',
        showLegend: !!config.mapping.color || config.type === 'pie' || config.type === 'stacked-bar',
        showLabels: true
    });

    const [timeGrain, setTimeGrain] = useState<TimeGrain>('daily');
    const [editForm, setEditForm] = useState<ChartConfig>(config);
    
    const columns = useMemo(() => (allData && allData.length > 0 ? Object.keys(allData[0]) : []), [allData]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
                setExpandedMenuGroup(null);
                setExpandedFilterItem(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    useEffect(() => {
        setViewOptions(prev => ({ ...prev, showGrid: config.type !== 'pie' && prev.showGrid, showLegend: (!!config.mapping.color || ['pie', 'stacked-bar', 'combo'].includes(config.type)) || prev.showLegend }));
    }, [config.type, config.mapping.color]);

    const filterableColumns = useMemo(() => {
        if (!allData || allData.length === 0) return [];
        const columns = Object.keys(allData[0]);
        const candidates: { col: string; values: string[] }[] = [];
        const MAX_UNIQUE_VALUES = 25;

        columns.forEach(col => {
            if (col === config.mapping.y || col === dateColumn) return;
            const uniqueValues: Set<string> = new Set(allData.slice(0, 500).map(row => String(row[col] || '')));
            if (uniqueValues.size > 1 && uniqueValues.size <= MAX_UNIQUE_VALUES) {
                const fullUnique = Array.from<string>(new Set(allData.map(row => String(row[col] || '')))).filter(v => v && v !== 'null' && v !== 'undefined' && v !== 'NaN');
                if (fullUnique.length <= MAX_UNIQUE_VALUES) candidates.push({ col, values: fullUnique.sort() });
            }
        });
        return candidates.slice(0, 4);
    }, [allData, config.mapping.y, dateColumn]);


    const toggleCategoryFilter = (col: string, val: string) => {
        const currentSet = new Set(activeFilters[col] || []);
        currentSet.has(val) ? currentSet.delete(val) : currentSet.add(val);
        onFilterChange(col, currentSet);
    };

    const handleSaveEdit = () => {
        if (onUpdate) onUpdate(editForm);
        setIsEditModalOpen(false);
        setIsMenuOpen(false);
    };
    
    const handleExportPNG = () => {
        const svgElement = chartContainerRef.current?.querySelector('svg');
        if (!svgElement) return;

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 2;
            canvas.width = svgElement.clientWidth * scale;
            canvas.height = svgElement.clientHeight * scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `${config.title.replace(/\s+/g, '_').toLowerCase()}.png`;
                link.click();
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
        setIsMenuOpen(false);
    };

    const handleDownloadCSV = () => {
        if (!data || data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvContent = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))].join('\n');
        const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${config.title.replace(/\s+/g, '_').toLowerCase()}.csv`;
        link.click();
        setIsMenuOpen(false);
    };

    const availableChartTypes = useMemo(() => {
        if (!allData || allData.length === 0) return [];
        const sample = allData[0];
        const xVal = sample[config.mapping.x], yVal = sample[config.mapping.y];
        const isXNumeric = !isNaN(Number(xVal)), isYNumeric = !isNaN(Number(yVal));
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
    }, [allData, config.mapping, config.type]);
    
    const isTimeBased = useMemo(() => {
         if (!allData || allData.length === 0) return false;
         const sampleX = allData[0][config.mapping.x];
         return !isNaN(Date.parse(sampleX)) && isNaN(Number(sampleX));
    }, [allData, config.mapping.x]);

    const renderChart = () => {
        const commonProps = { data, mapping: config.mapping, viewOptions, colors: config.colors || PALETTES['Default'], formatLabel: formatColumnName };
        switch (config.type) {
            case 'bar': return <RechartsBarChart {...commonProps} />;
            case 'stacked-bar': return <RechartsBarChart {...commonProps} isStacked={true} />;
            case 'line': return <RechartsLineChart {...commonProps} timeGrain={timeGrain} enableScrollZoom={enableScrollZoom} />;
            case 'area': return <RechartsLineChart {...commonProps} isArea={true} timeGrain={timeGrain} enableScrollZoom={enableScrollZoom} />;
            case 'pie': return <RechartsPieChart {...commonProps} />;
            case 'scatter': return <RechartsScatterChart {...commonProps} enableScrollZoom={enableScrollZoom} />;
            case 'bubble': return <RechartsScatterChart {...commonProps} isBubble={true} enableScrollZoom={enableScrollZoom} />;
            case 'combo': return <RechartsComboChart {...commonProps} />;
            default: return <div className="flex items-center justify-center h-full text-slate-500">Unsupported chart type.</div>;
        }
    };

    const renderPreviewChart = () => {
        if (!allData || allData.length === 0) return <div className="flex items-center justify-center h-full text-slate-500">No data to preview.</div>;
        
        const previewViewOptions: ViewOptions = { showGrid: true, showLegend: true, showLabels: false };
        const commonProps = { data: allData, mapping: editForm.mapping, viewOptions: previewViewOptions, colors: editForm.colors || PALETTES['Default'], formatLabel: formatColumnName };

        switch (editForm.type) {
            case 'bar': return <RechartsBarChart {...commonProps} />;
            case 'stacked-bar': return <RechartsBarChart {...commonProps} isStacked={true} />;
            case 'line': return <RechartsLineChart {...commonProps} timeGrain={'daily'} enableScrollZoom={false} />;
            case 'area': return <RechartsLineChart {...commonProps} isArea={true} timeGrain={'daily'} enableScrollZoom={false} />;
            case 'pie': return <RechartsPieChart {...commonProps} />;
            case 'scatter': return <RechartsScatterChart {...commonProps} enableScrollZoom={false} />;
            case 'bubble': return <RechartsScatterChart {...commonProps} isBubble={true} enableScrollZoom={false} />;
            case 'combo': return <RechartsComboChart {...commonProps} />;
            default: return <div className="flex items-center justify-center h-full text-slate-500">Select a valid chart type.</div>;
        }
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('mapping.')) {
            const mappingKey = name.split('.')[1];
            setEditForm(prev => ({ ...prev, mapping: { ...prev.mapping, [mappingKey]: value } }));
        } else {
            setEditForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const ToggleButton = ({ icon: Icon, label, isActive, onClick }: { icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }) => (
        <button onClick={onClick} title={label} className={`p-1.5 rounded-md transition-all duration-200 flex items-center space-x-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
            <Icon size={14} /><span className="text-[11px] font-medium">{label}</span>
        </button>
    );

    const hasActiveFilters = activeTimeFilter.type !== 'all' || Object.values(activeFilters).some((s: Set<string>) => s.size > 0);
    const AccordionTrigger = ({ label, icon: Icon, isActive, onClick, hasActiveChild }: { label: string, icon: React.ElementType, isActive: boolean, onClick: () => void, hasActiveChild: boolean }) => (
        <button onClick={onClick} className={`w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between ${hasActiveChild ? 'bg-primary-50/50' : ''}`}>
            <div className="flex items-center">
                <Icon size={16} className={`mr-3 ${hasActiveChild ? 'text-primary-600' : 'text-slate-400'}`} />
                <span className={hasActiveChild ? 'font-medium text-primary-900' : ''}>{label}</span>
            </div>
            <ChevronRight size={16} className={`text-slate-400 transition-transform ${isActive ? 'rotate-90' : ''}`} />
        </button>
    );

    return (
        <>
            <div className="flex flex-col h-full w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300 relative group">
                <div className="px-6 pt-5 pb-0 flex justify-between items-start relative z-10 flex-shrink-0">
                    <div className="flex-1 pr-8">
                        <h3 className="text-lg font-semibold text-slate-900 leading-tight">{config.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2" title={config.description}>{config.description}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                        {onMaximize && (
                            <button onClick={() => onMaximize(config)} className='p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100'>
                                <Maximize size={16} />
                            </button>
                        )}
                        {onUpdate && (
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-1.5 rounded-full transition-colors ${isMenuOpen || hasActiveFilters ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                                    <MoreVertical size={20} />
                                    {hasActiveFilters && !isMenuOpen && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary-500 border-2 border-white rounded-full"></span>}
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 duration-100 origin-top-right max-h-[80vh] overflow-y-auto custom-scrollbar">
                                        <button onClick={() => { setIsEditModalOpen(true); setEditForm(config); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center transition-colors"><Edit3 size={16} className="mr-3 text-slate-400" /> Edit Chart</button>
                                        <div className="my-2 border-t border-slate-100" />
                                        
                                        <div>
                                            <AccordionTrigger label="Export" icon={Download} isActive={expandedMenuGroup === 'export'} onClick={() => setExpandedMenuGroup(g => g === 'export' ? null : 'export')} hasActiveChild={false} />
                                            {expandedMenuGroup === 'export' && (
                                                <div className="bg-slate-50 border-y border-slate-100">
                                                    <button onClick={handleExportPNG} className="w-full text-left px-8 py-2.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center transition-colors"><ImageIcon size={14} className="mr-3 text-slate-400" /> Export as PNG</button>
                                                    <button onClick={handleDownloadCSV} className="w-full text-left px-8 py-2.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center transition-colors"><Download size={14} className="mr-3 text-slate-400" /> Export CSV Data</button>
                                                </div>
                                            )}
                                        </div>

                                        {(dateColumn || filterableColumns.length > 0) && (
                                            <div>
                                                <div className="flex justify-between items-center">
                                                    <AccordionTrigger label="Filter Data" icon={Filter} isActive={expandedMenuGroup === 'filter'} onClick={() => setExpandedMenuGroup(g => g === 'filter' ? null : 'filter')} hasActiveChild={hasActiveFilters} />
                                                    {hasActiveFilters && expandedMenuGroup !== 'filter' && <button onClick={() => { onTimeFilterChange({type: 'all'}); onFilterChange('__clear__', new Set()); }} className="absolute right-12 text-[10px] text-primary-600 hover:text-primary-700">Clear</button>}
                                                </div>
                                                {expandedMenuGroup === 'filter' && (
                                                    <div className="bg-slate-50 border-y border-slate-100">
                                                        {hasActiveFilters && <div className="px-4 pt-3 pb-1"><button onClick={() => { onTimeFilterChange({type: 'all'}); onFilterChange('__clear__', new Set()); }} className="w-full text-center text-xs py-1 text-primary-600 bg-primary-100 hover:bg-primary-200 rounded">Clear All Filters</button></div>}
                                                        {dateColumn && (
                                                            <div>
                                                                <button onClick={() => setExpandedFilterItem(s => s === 'time' ? null : 'time')} className={`w-full text-left px-8 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between ${activeTimeFilter.type !== 'all' ? 'bg-primary-50/50' : ''}`}>
                                                                    <div className="flex items-center"><Calendar size={14} className={`mr-2 ${activeTimeFilter.type !== 'all' ? 'text-primary-600' : 'text-slate-400'}`} /> <span className={activeTimeFilter.type !== 'all' ? 'font-medium text-primary-900' : ''}>Time Period</span></div>
                                                                    <ChevronRight size={14} className={`text-slate-400 transition-transform ${expandedFilterItem === 'time' ? 'rotate-90' : ''}`} />
                                                                </button>
                                                                {expandedFilterItem === 'time' && (
                                                                    <div className="bg-slate-100 px-4 py-3 border-y border-slate-200 space-y-3">
                                                                        <div className="grid grid-cols-3 gap-2">{['all', '7d', '30d', '90d', 'ytd'].map(p => <button key={p} onClick={() => onTimeFilterChange({type: p as TimeFilterPreset})} className={`px-2 py-1.5 text-xs font-medium rounded border transition-colors ${activeTimeFilter.type === p ? 'bg-primary-100 border-primary-300 text-primary-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>{p === 'all' ? 'All' : p.toUpperCase()}</button>)}</div>
                                                                        <div className="flex items-center space-x-2"><input type="date" className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-primary-500 disabled:bg-slate-200" value={activeTimeFilter.start || ''} onChange={e => onTimeFilterChange({type:'custom', start: e.target.value, end: activeTimeFilter.end})} /><span className="text-slate-400">-</span><input type="date" className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-primary-500 disabled:bg-slate-200" value={activeTimeFilter.end || ''} onChange={e => onTimeFilterChange({type:'custom', start:activeTimeFilter.start, end: e.target.value})} /></div>
                                                                        {isTimeBased && (
                                                                             <div className="pt-2">
                                                                                <label className="text-xs font-medium text-slate-500 mb-1 block">Group By</label>
                                                                                <div className="grid grid-cols-4 gap-2">
                                                                                    {(['daily', 'weekly', 'monthly', 'yearly'] as TimeGrain[]).map(g => <button key={g} onClick={() => setTimeGrain(g)} className={`px-2 py-1.5 text-xs font-medium rounded border transition-colors ${timeGrain === g ? 'bg-primary-100 border-primary-300 text-primary-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>{g.charAt(0).toUpperCase() + g.slice(1)}</button>)}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {filterableColumns.map((colData) => {
                                                            const activeCount = (activeFilters[colData.col] as Set<string> | undefined)?.size || 0;
                                                            const isExpanded = expandedFilterItem === `cat_${colData.col}`;
                                                            return (
                                                                <div key={colData.col}>
                                                                    <button onClick={() => setExpandedFilterItem(s => isExpanded ? null : `cat_${colData.col}`)} className={`w-full text-left px-8 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between ${activeCount > 0 ? 'bg-primary-50/50' : ''}`}>
                                                                        <div className="flex items-center truncate mr-2"><span className={`truncate ${activeCount > 0 ? 'font-medium text-primary-900' : ''}`}>{formatColumnName(colData.col)}</span>{activeCount > 0 && <span className="ml-2 bg-primary-100 text-primary-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeCount}</span>}</div>
                                                                        <ChevronRight size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                                    </button>
                                                                    {isExpanded && (
                                                                        <div className="bg-slate-100 max-h-48 overflow-y-auto custom-scrollbar border-y border-slate-200">{colData.values.map(val => <button key={val} onClick={(e) => { e.stopPropagation(); toggleCategoryFilter(colData.col, val); }} className={`w-full text-left px-10 py-2 text-xs flex items-center justify-between hover:bg-slate-200/50 ${activeFilters[colData.col]?.has(val) ? 'text-primary-700 font-medium bg-primary-50/50' : 'text-slate-600'}`}><span className="truncate mr-2">{val}</span>{activeFilters[colData.col]?.has(val) && <Check size={14} className="text-primary-600" />}</button>)}</div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {onUpdate && (
                                            <div>
                                                <AccordionTrigger label="Color Palette" icon={Palette} isActive={expandedMenuGroup === 'color'} onClick={() => setExpandedMenuGroup(g => g === 'color' ? null : 'color')} hasActiveChild={!!config.colors && config.colors !== PALETTES['Default']} />
                                                {expandedMenuGroup === 'color' && (
                                                    <div className="bg-slate-50 border-y border-slate-100 p-2 grid grid-cols-2 gap-2">
                                                        {Object.entries(PALETTES).map(([name, colors]) => (
                                                            <button key={name} onClick={() => onUpdate({ ...config, colors })} className={`p-2 rounded-md hover:bg-slate-100 ${JSON.stringify(config.colors) === JSON.stringify(colors) ? 'ring-2 ring-primary-500' : ''}`}>
                                                                <div className="text-xs text-slate-600 mb-1.5 text-left font-medium">{name}</div>
                                                                <div className="flex space-x-1 h-4">{colors.map(c => <div key={c} className="w-full h-full rounded-full" style={{ backgroundColor: c }} />)}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {availableChartTypes.length > 0 && onUpdate && (
                                            <div>
                                                <AccordionTrigger label="Switch Chart Type" icon={BarChart} isActive={expandedMenuGroup === 'chart'} onClick={() => setExpandedMenuGroup(g => g === 'chart' ? null : 'chart')} hasActiveChild={false} />
                                                {expandedMenuGroup === 'chart' && (
                                                     <div className="bg-slate-50 border-y border-slate-100">
                                                        {availableChartTypes.map(item => <button key={item.type} onClick={() => onUpdate({...config, type: item.type})} className="w-full text-left px-8 py-2.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between group/item"><div className="flex items-center"><item.icon size={14} className="mr-3 text-slate-400 group-hover/item:text-primary-500 transition-colors" /> {item.label}</div>{item.recommended && <span className="text-[10px] font-medium bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">Smart Match</span>}</button>)}
                                                     </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-shrink-0 flex justify-center items-center space-x-1 py-2 mt-4">
                        {config.type !== 'pie' && <ToggleButton icon={Grid} label="Grid" isActive={viewOptions.showGrid} onClick={() => setViewOptions(p => ({ ...p, showGrid: !p.showGrid }))} />}
                        <ToggleButton icon={List} label="Legend" isActive={viewOptions.showLegend} onClick={() => setViewOptions(p => ({ ...p, showLegend: !p.showLegend }))} />
                        <ToggleButton icon={Tag} label="Values" isActive={viewOptions.showLabels} onClick={() => setViewOptions(p => ({ ...p, showLabels: !p.showLabels }))} />
                    </div>
                    
                    <div ref={chartContainerRef} className="flex-1 px-4 pb-4 min-h-0 relative z-0">
                        {data.length > 0 ? renderChart() : <div className="flex items-center justify-center h-full text-slate-500">No data available for the selected filters.</div>}
                    </div>
                </div>
            </div>
            {isEditModalOpen && (
                 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}>
                    <div role="dialog" aria-modal="true" aria-labelledby="edit-chart-modal-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] relative flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 pb-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                            <h3 id="edit-chart-modal-title" className="text-xl font-bold text-slate-900 flex items-center"><Edit3 size={20} className="mr-3 text-primary-600" />Edit Chart</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 min-h-0">
                            <div className="lg:col-span-1 p-6 border-r border-slate-200 overflow-y-auto custom-scrollbar space-y-5">
                                <ControlWrapper label="Chart Title">
                                    <input type="text" name="title" value={editForm.title} onChange={handleFormChange} className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                                </ControlWrapper>
                                <ControlWrapper label="Insight Description">
                                    <textarea name="description" value={editForm.description} onChange={handleFormChange} className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none h-24" required />
                                </ControlWrapper>
                                <div className="border-t border-slate-200 my-6" />
                                <ControlWrapper label="Chart Type">
                                     <select name="type" value={editForm.type} onChange={handleFormChange} className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                                        {CHART_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </ControlWrapper>
                                 <ControlWrapper label="X-Axis (Category)">
                                    <select name="mapping.x" value={editForm.mapping.x} onChange={handleFormChange} className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </ControlWrapper>
                                <ControlWrapper label="Y-Axis (Value)">
                                    <select name="mapping.y" value={editForm.mapping.y} onChange={handleFormChange} className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </ControlWrapper>
                                {(['stacked-bar', 'combo'].includes(editForm.type)) && (
                                    <ControlWrapper label="Color / Line Metric">
                                        <select name="mapping.color" value={editForm.mapping.color || ''} onChange={handleFormChange} className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                                            <option value="">None</option>
                                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                        </select>
                                    </ControlWrapper>
                                )}
                                 {editForm.type === 'bubble' && (
                                    <ControlWrapper label="Bubble Size (Z-Axis)">
                                        <select name="mapping.z" value={editForm.mapping.z || ''} onChange={handleFormChange} className="w-full px-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                                            <option value="">None</option>
                                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                        </select>
                                    </ControlWrapper>
                                )}
                            </div>
                            <div className="lg:col-span-2 p-6 flex flex-col">
                                <h4 className="text-sm font-semibold text-slate-600 mb-4 flex-shrink-0">Live Preview</h4>
                                <div className="flex-1 min-h-0 bg-slate-50 rounded-lg p-2 border border-slate-200">
                                    {renderPreviewChart()}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 pt-4 border-t border-slate-200 flex justify-end space-x-3 flex-shrink-0">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
                            <button type="button" onClick={handleSaveEdit} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export const ChartRenderer = memo(ChartRendererComponent);