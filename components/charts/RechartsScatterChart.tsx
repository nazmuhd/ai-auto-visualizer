
import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DataRow, ChartMapping } from '../../types';
import { ViewOptions } from './ChartRenderer';

interface Props {
    data: DataRow[];
    mapping: ChartMapping;
    viewOptions: ViewOptions;
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

// Simple downsampler
const downsample = (data: any[], targetLimit: number) => {
    if (data.length <= targetLimit) return data;
    const step = Math.ceil(data.length / targetLimit);
    return data.filter((_, i) => i % step === 0);
};

export const RechartsScatterChart: React.FC<Props> = ({ data, mapping, viewOptions }) => {
    const { processedData, groups } = useMemo(() => {
        let formatted = data.map(d => ({
            ...d,
            [mapping.x]: Number(d[mapping.x]),
            [mapping.y]: Number(d[mapping.y])
        })).filter(d => !isNaN(d[mapping.x]) && !isNaN(d[mapping.y]));

        // Downsample scatter data if it's too large for performant SVG rendering
        formatted = downsample(formatted, 800);

        if (mapping.color) {
             const uniqueGroups = Array.from(new Set(formatted.map(d => String(d[mapping.color!]))));
             return { processedData: formatted, groups: uniqueGroups };
        }

        return { processedData: formatted, groups: ['default'] };

    }, [data, mapping]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                {viewOptions.showGrid && (
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                )}
                <XAxis 
                    type="number" 
                    dataKey={mapping.x} 
                    name={mapping.x} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    label={{ value: mapping.x, position: 'bottom', offset: 0, fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)}
                />
                <YAxis 
                    type="number" 
                    dataKey={mapping.y} 
                    name={mapping.y} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: mapping.y, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)}
                />
                <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value)}
                />
                {viewOptions.showLegend && mapping.color && <Legend />}
                {groups.map((group, index) => (
                    <Scatter
                        key={group}
                        name={group === 'default' ? undefined : group}
                        data={mapping.color ? processedData.filter(d => String(d[mapping.color!]) === group) : processedData}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.6}
                    />
                ))}
            </ScatterChart>
        </ResponsiveContainer>
    );
};
