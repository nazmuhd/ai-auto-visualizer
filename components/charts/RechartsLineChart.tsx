import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush, LabelList } from 'recharts';
import { DataRow, ChartMapping, TimeGrain } from '../../types.ts';
import { ViewOptions } from './ChartRenderer.tsx';
import { RotateCcw } from 'lucide-react';

interface Props {
    data: DataRow[];
    mapping: ChartMapping;
    isArea?: boolean;
    viewOptions: ViewOptions;
    colors: string[];
    enableScrollZoom?: boolean;
    timeGrain: TimeGrain;
    formatLabel: (label: string) => string;
}

const getWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const truncateDate = (date: Date, grain: TimeGrain): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (grain === 'weekly') {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        return new Date(d.setDate(diff));
    }
    if (grain === 'monthly') return new Date(d.getFullYear(), d.getMonth(), 1);
    if (grain === 'quarterly') return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
    if (grain === 'yearly') return new Date(d.getFullYear(), 0, 1);
    return d; // Daily
};

export const RechartsLineChart: React.FC<Props> = ({ data, mapping, isArea = false, viewOptions, colors, enableScrollZoom = false, timeGrain, formatLabel }) => {
    const { processedData, dataKeys, isTemporal } = useMemo(() => {
        if (!data || data.length === 0) return { processedData: [], dataKeys: [], isTemporal: false };
        const sampleX = data[0][mapping.x];
        const isTemporal = !isNaN(Date.parse(sampleX)) && isNaN(Number(sampleX));
        const aggMap = new Map<string | number, any>();
        const seriesDataCounters = new Map<string, number>();

        data.forEach(row => {
            let xKeyRaw = row[mapping.x];
            if (!xKeyRaw) return;
            let groupKey: string | number;

            if (isTemporal) {
                const date = new Date(xKeyRaw);
                if (isNaN(date.getTime())) return;
                groupKey = truncateDate(date, timeGrain).getTime();
            } else {
                groupKey = xKeyRaw;
            }
            
            if (!aggMap.has(groupKey)) aggMap.set(groupKey, { [mapping.x]: isTemporal ? new Date(groupKey) : groupKey });
            
            const aggEntry = aggMap.get(groupKey);
            const yVal = Number(row[mapping.y]) || 0;
            const seriesKey = mapping.color ? String(row[mapping.color]) : mapping.y;
            
            if (!aggEntry[seriesKey]) aggEntry[seriesKey] = 0;
            
            const counterKey = `${groupKey}-${seriesKey}`;
            const currentCount = seriesDataCounters.get(counterKey) || 0;
            seriesDataCounters.set(counterKey, currentCount + 1);

            if (mapping.aggregation === 'average') {
                 aggEntry[`_${seriesKey}_sum`] = (aggEntry[`_${seriesKey}_sum`] || 0) + yVal;
                 aggEntry[seriesKey] = aggEntry[`_${seriesKey}_sum`] / (currentCount + 1);
            } else {
                aggEntry[seriesKey] += (mapping.aggregation === 'count') ? 1 : yVal;
            }
        });

        let results = Array.from(aggMap.values()).sort((a, b) => {
             if (isTemporal) return a[mapping.x].getTime() - b[mapping.x].getTime();
             if (typeof a[mapping.x] === 'number' && typeof b[mapping.x] === 'number') return a[mapping.x] - b[mapping.x];
             return String(a[mapping.x]).localeCompare(String(b[mapping.x]));
        });

        const keys = mapping.color ? Array.from(new Set(data.map(d => String(d[mapping.color!])))) : [mapping.y];
        return { processedData: results, dataKeys: keys, isTemporal };

    }, [data, mapping, timeGrain]);

    const [brushDomain, setBrushDomain] = useState<{ startIndex?: number, endIndex?: number }>({});
    const [chartKey, setChartKey] = useState(0);
    const chartWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setBrushDomain({}); }, [processedData]);

    const xAxisDomain = useMemo(() => {
        if (processedData.length === 0) return [undefined, undefined];
        const { startIndex, endIndex } = brushDomain;
        if (startIndex !== undefined && endIndex !== undefined) {
            const startValue = processedData[startIndex][mapping.x];
            const endValue = processedData[endIndex][mapping.x];
            return [startValue, endValue];
        }
        return [undefined, undefined];
    }, [brushDomain, processedData, mapping.x]);
    
    const handleWheelZoom = useCallback((e: WheelEvent) => {
        e.preventDefault();
        setBrushDomain(prevDomain => {
            const { startIndex = 0, endIndex = processedData.length - 1 } = prevDomain;
            const range = endIndex - startIndex;
            if (range <= 1 && e.deltaY < 0) return prevDomain; // Don't zoom in further than 2 points

            const zoomFactor = 0.1;
            const change = Math.ceil(range * zoomFactor);
            
            if (e.deltaY < 0) { // Zoom in
                const newStart = Math.min(endIndex - 2, startIndex + change); // ensure range is at least 2
                const newEnd = Math.max(newStart + 1, endIndex - change);
                return { startIndex: newStart, endIndex: newEnd };
            } else { // Zoom out
                const newStart = Math.max(0, startIndex - change);
                const newEnd = Math.min(processedData.length - 1, endIndex + change);
                return { startIndex: newStart, endIndex: newEnd };
            }
        });
    }, [processedData.length]);
    
    const handleResetZoom = () => {
        setBrushDomain({});
        setChartKey(k => k + 1);
    };

    useEffect(() => {
        const chartElement = chartWrapperRef.current;
        if (enableScrollZoom && chartElement) {
            chartElement.addEventListener('wheel', handleWheelZoom, { passive: false });
            return () => chartElement.removeEventListener('wheel', handleWheelZoom);
        }
    }, [enableScrollZoom, handleWheelZoom]);

    const isZoomed = brushDomain.startIndex !== undefined && (brushDomain.startIndex > 0 || (brushDomain.endIndex !== undefined && brushDomain.endIndex < processedData.length - 1));

    const ChartComponent = isArea ? AreaChart : LineChart;
    const DataComponent = isArea ? Area : Line;

    return (
        <div className="w-full h-full relative" ref={chartWrapperRef}>
             {isZoomed && enableScrollZoom && (
                <button onClick={handleResetZoom} className="absolute top-0 right-8 z-20 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-medium px-2.5 py-1 rounded-md flex items-center shadow-sm">
                    <RotateCcw size={12} className="mr-1.5"/> Reset Zoom
                </button>
            )}
            <ResponsiveContainer width="100%" height="100%">
                <ChartComponent
                    key={chartKey}
                    data={processedData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                    {viewOptions.showGrid && (
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    )}
                    <XAxis 
                        dataKey={mapping.x}
                        domain={xAxisDomain as any}
                        allowDataOverflow={true}
                        tickFormatter={(val) => {
                            if (!isTemporal) return val;
                            const date = new Date(val);
                            if (timeGrain === 'yearly') return date.getFullYear().toString();
                            if (timeGrain === 'monthly' || timeGrain === 'quarterly') return date.toLocaleDateString(undefined, { year: '2-digit', month: 'short' });
                            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        }}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                        minTickGap={40}
                        interval="preserveStartEnd"
                    />
                    <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)}
                        width={40}
                        domain={[0, 'dataMax']}
                        allowDataOverflow={true}
                    />
                    <Tooltip 
                        labelFormatter={(val) => isTemporal ? new Date(val).toLocaleDateString() : val}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        formatter={(value: number, name: string) => [new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value), formatLabel(name)]}
                    />
                    {viewOptions.showLegend && (
                        <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} formatter={(value) => formatLabel(value)} />
                    )}
                    {dataKeys.map((key, index) => (
                         <DataComponent
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[index % colors.length]}
                            fill={isArea ? colors[index % colors.length] : undefined}
                            fillOpacity={isArea ? 0.2 : undefined}
                            strokeWidth={2}
                            dot={processedData.length < 50}
                            activeDot={{ r: 6 }}
                            name={key}
                            connectNulls
                        />
                    ))}
                    {processedData.length > 20 && (
                        <Brush 
                            dataKey={mapping.x}
                            height={25}
                            stroke="#cbd5e1"
                            fill="#f8fafc"
                            tickFormatter={(val) => isTemporal ? new Date(val).toLocaleDateString(undefined, {month: 'short'}) : ''}
                            travellerWidth={10}
                            className="hidden md:block"
                            startIndex={brushDomain.startIndex}
                            endIndex={brushDomain.endIndex}
                            onChange={(domain) => setBrushDomain(domain as any)}
                        />
                    )}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    );
};