
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend, LabelList } from 'recharts';
import { DataRow, ChartMapping } from '../../types.ts';
import { ViewOptions } from './ChartRenderer.tsx';

interface Props {
    data: DataRow[];
    mapping: ChartMapping;
    viewOptions: ViewOptions;
}

export const RechartsBarChart: React.FC<Props> = ({ data, mapping, viewOptions }) => {
    const processedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // If no aggregation is specified, assume data is pre-aggregated and just sort it.
        if (mapping.aggregation === 'none') {
            return [...data].sort((a, b) => Number(b[mapping.y]) - Number(a[mapping.y]));
        }

        // 1. Aggregate by X category
        const map = new Map<string, { sum: number, count: number, values: number[] }>();
        
        data.forEach(row => {
            const key = String(row[mapping.x] || 'Unknown');
            const val = Number(row[mapping.y]) || 0;
            
            if (!map.has(key)) map.set(key, { sum: 0, count: 0, values: [] });
            const entry = map.get(key)!;
            entry.sum += val;
            entry.count += 1;
            entry.values.push(val);
        });

        // 2. Apply specific aggregation and format for Chart
        const result = Array.from(map, ([key, stats]) => {
            let finalVal = stats.sum;
            if (mapping.aggregation === 'average') finalVal = stats.sum / stats.count;
            else if (mapping.aggregation === 'count') finalVal = stats.count;

            return { [mapping.x]: key, [mapping.y]: finalVal };
        });

        // 3. Sort descending to show "Top" items first
        return result.sort((a, b) => Number(b[mapping.y]) - Number(a[mapping.y]));

    }, [data, mapping]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={processedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                {viewOptions.showGrid && (
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                )}
                <XAxis 
                    dataKey={mapping.x} 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    tickFormatter={(val) => {
                        const str = String(val);
                        return str.length > 14 ? str.substring(0, 12) + '...' : str;
                    }}
                />
                <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)}
                    width={40}
                />
                <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    formatter={(value: number) => [new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value), mapping.y]}
                />
                {viewOptions.showLegend && (
                    <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                )}
                <Bar 
                    dataKey={mapping.y} 
                    fill="#0ea5e9" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={60}
                    name={mapping.y} // For legend
                >
                    {viewOptions.showLabels && (
                        <LabelList 
                            dataKey={mapping.y} 
                            position="top" 
                            formatter={(val: number) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(val)}
                            style={{ fontSize: '10px', fill: '#64748b' }} 
                        />
                    )}
                </Bar>
                {/* Responsive Brush: Hidden on small screens */}
                <Brush 
                    dataKey={mapping.x}
                    height={25}
                    stroke="#cbd5e1"
                    fill="#f8fafc"
                    tickFormatter={() => ''}
                    travellerWidth={10}
                    className="hidden md:block"
                />
            </BarChart>
        </ResponsiveContainer>
    );
};