
import React, { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush, LabelList } from 'recharts';
import { DataRow, ChartMapping } from '../../types';
import { ViewOptions } from './ChartRenderer';

interface Props {
    data: DataRow[];
    mapping: ChartMapping;
    isArea?: boolean;
    viewOptions: ViewOptions;
}

// Simple Nth-item downsampler for performance
const downsample = (data: any[], targetLimit: number) => {
    if (data.length <= targetLimit) return data;
    const step = Math.ceil(data.length / targetLimit);
    return data.filter((_, i) => i % step === 0);
};

export const RechartsLineChart: React.FC<Props> = ({ data, mapping, isArea = false, viewOptions }) => {
    const { processedData, dataKeys, isTemporal } = useMemo(() => {
        if (!data || data.length === 0) return { processedData: [], dataKeys: [], isTemporal: false };

        // 1. Detect if X axis is likely a date/time
        const sampleX = data[0][mapping.x];
        const isTemporal = !isNaN(Date.parse(sampleX)) && isNaN(Number(sampleX));

        // 2. Aggregate Data (Crucial for "Plug & Play" on raw data)
        const aggMap = new Map<string | number, any>();

        data.forEach(row => {
            let xKeyRaw = row[mapping.x];
            let groupKey: string | number = xKeyRaw;

            if (isTemporal) {
                const date = new Date(xKeyRaw);
                if (!isNaN(date.getTime())) {
                     groupKey = date.setHours(0,0,0,0); 
                }
            }

            if (!aggMap.has(groupKey)) {
                aggMap.set(groupKey, { [mapping.x]: groupKey, _count: 0 });
            }

            const aggEntry = aggMap.get(groupKey);
            aggEntry._count += 1;

            const yVal = Number(row[mapping.y]) || 0;
            const seriesKey = mapping.color ? String(row[mapping.color]) : mapping.y;

            if (!aggEntry[seriesKey]) aggEntry[seriesKey] = 0;

            if (mapping.aggregation === 'average') {
                 aggEntry[`_${seriesKey}_sum`] = (aggEntry[`_${seriesKey}_sum`] || 0) + yVal;
                 aggEntry[seriesKey] = aggEntry[`_${seriesKey}_sum`] / aggEntry._count;
            } else {
                aggEntry[seriesKey] += (mapping.aggregation === 'count') ? 1 : yVal;
            }
        });

        let results = Array.from(aggMap.values()).sort((a, b) => {
             if (typeof a[mapping.x] === 'number' && typeof b[mapping.x] === 'number') {
                 return a[mapping.x] - b[mapping.x];
             }
             return String(a[mapping.x]).localeCompare(String(b[mapping.x]));
        });

        if (isTemporal) {
            results = results.map(r => ({
                ...r,
                [mapping.x]: r[mapping.x], 
                _displayX: new Date(r[mapping.x]).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
            }));
        }

        // 3. Downsample for rendering performance if dataset is large
        const finalData = downsample(results, 500);

        let keys: string[] = [];
        if (mapping.color) {
            const keySet = new Set<string>();
            data.forEach(d => keySet.add(String(d[mapping.color!])));
            keys = Array.from(keySet);
        } else {
            keys = [mapping.y];
        }

        return { processedData: finalData, dataKeys: keys, isTemporal };

    }, [data, mapping]);

    const colors = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];
    const ChartComponent = isArea ? AreaChart : LineChart;
    const DataComponent = isArea ? Area : Line;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ChartComponent
                data={processedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                {viewOptions.showGrid && (
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                )}
                <XAxis 
                    dataKey={mapping.x}
                    tickFormatter={(val) => isTemporal ? new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : val}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    minTickGap={30}
                />
                <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)}
                    width={40}
                />
                <Tooltip 
                    labelFormatter={(val) => isTemporal ? new Date(val).toLocaleDateString() : val}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    formatter={(value: number, name: string) => [
                        new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value), 
                        mapping.color ? name : mapping.y
                    ]}
                />
                {viewOptions.showLegend && (
                    <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
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
                        dot={false}
                        activeDot={{ r: 6 }}
                        name={key}
                        connectNulls
                    >
                        {/* Only show labels on first series to prevent visual chaos in multi-series charts */}
                        {viewOptions.showLabels && index === 0 && (
                             <LabelList 
                                dataKey={key} 
                                position="top"
                                formatter={(val: number) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(val)}
                                style={{ fontSize: '9px', fill: colors[index % colors.length] }} 
                            />
                        )}
                    </DataComponent>
                ))}
                <Brush 
                    dataKey={mapping.x}
                    height={25}
                    stroke="#cbd5e1"
                    fill="#f8fafc"
                    tickFormatter={() => ''}
                    travellerWidth={10}
                />
            </ChartComponent>
        </ResponsiveContainer>
    );
};
