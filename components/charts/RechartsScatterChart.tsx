import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DataRow, ChartMapping } from '../../types.ts';
import { ViewOptions } from './ChartRenderer.tsx';

interface Props {
    data: DataRow[];
    mapping: ChartMapping;
    viewOptions: ViewOptions;
    isBubble?: boolean;
    colors: string[];
    formatLabel: (label: string) => string;
}

const downsample = (data: any[], targetLimit: number) => {
    if (data.length <= targetLimit) return data;
    const step = Math.ceil(data.length / targetLimit);
    return data.filter((_, i) => i % step === 0);
};

export const RechartsScatterChart: React.FC<Props> = ({ data, mapping, viewOptions, isBubble = false, colors, formatLabel }) => {
    const { processedData, groups, zDomain } = useMemo(() => {
        let formatted = data.map(d => ({
            ...d,
            [mapping.x]: Number(d[mapping.x]),
            [mapping.y]: Number(d[mapping.y]),
            [mapping.z || 'z']: isBubble ? Number(d[mapping.z!]) : null
        })).filter(d => !isNaN(d[mapping.x]) && !isNaN(d[mapping.y]));

        let domain = [0, 0];
        if (isBubble) {
            const zValues = formatted.map(d => d[mapping.z!]).filter(v => !isNaN(v));
            if (zValues.length > 0) domain = [Math.min(...zValues), Math.max(...zValues)];
        }
        
        formatted = downsample(formatted, 800);

        if (mapping.color) {
             const uniqueGroups = Array.from(new Set(formatted.map(d => String(d[mapping.color!])))).sort();
             return { processedData: formatted, groups: uniqueGroups, zDomain: domain };
        }

        return { processedData: formatted, groups: ['default'], zDomain: domain };

    }, [data, mapping, isBubble]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                {viewOptions.showGrid && (
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                )}
                <XAxis 
                    type="number" 
                    dataKey={mapping.x} 
                    name={formatLabel(mapping.x)} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    label={{ value: formatLabel(mapping.x), position: 'bottom', offset: 0, fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)}
                />
                <YAxis 
                    type="number" 
                    dataKey={mapping.y} 
                    name={formatLabel(mapping.y)} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: formatLabel(mapping.y), angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)}
                />
                {isBubble && <ZAxis type="number" dataKey={mapping.z} name={formatLabel(mapping.z || '')} domain={zDomain} range={[10, 500]} />}
                <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, name: string) => [new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value), formatLabel(name)]}
                />
                {viewOptions.showLegend && mapping.color && <Legend formatter={(value) => formatLabel(value)}/>}
                {groups.map((group, index) => (
                    <Scatter
                        key={group}
                        name={group === 'default' ? (isBubble && mapping.z ? formatLabel(mapping.z) : formatLabel(mapping.y)) : formatLabel(group)}
                        data={mapping.color ? processedData.filter(d => String(d[mapping.color!]) === group) : processedData}
                        fill={colors[index % colors.length]}
                        fillOpacity={0.6}
                        shape={isBubble ? "circle" : "star"}
                    />
                ))}
            </ScatterChart>
        </ResponsiveContainer>
    );
};