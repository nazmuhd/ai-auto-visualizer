import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DataRow, ChartMapping } from '../../types.ts';
import { ViewOptions } from './ChartRenderer.tsx';

interface Props {
    data: DataRow[];
    mapping: ChartMapping;
    viewOptions: ViewOptions;
    colors: string[];
    formatLabel: (label: string) => string;
}

export const RechartsPieChart: React.FC<Props> = ({ data, mapping, viewOptions, colors, formatLabel }) => {
    const processedData = useMemo(() => {
        const map = new Map<string, number>();
        data.forEach(row => {
            const key = String(row[mapping.x]);
            const val = Number(row[mapping.y]) || 0;
            map.set(key, (map.get(key) || 0) + (mapping.aggregation === 'count' ? 1 : val));
        });

        let result = Array.from(map, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        if (result.length > 8) {
            const top = result.slice(0, 7);
            const other = result.slice(7).reduce((sum, item) => sum + item.value, 0);
            result = [...top, { name: 'Other', value: other }];
        }
        return result;
    }, [data, mapping]);

    const formatSmartLabel = (name: string, percent: number) => {
        const threshold = 0.03;
        if (percent < threshold) return '';
        
        const nameStr = formatLabel(String(name));
        const truncatedName = nameStr.length > 15 ? nameStr.substring(0, 12) + '...' : nameStr;
        return `${truncatedName} (${(percent * 100).toFixed(0)}%)`;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                <Pie
                    data={processedData}
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    innerRadius="45%"
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={viewOptions.showLabels ? ({ name, percent }) => formatSmartLabel(name, percent) : false}
                    labelLine={viewOptions.showLabels ? { stroke: '#cbd5e1', strokeWidth: 1 } : false}
                    className="text-xs font-medium fill-slate-600"
                >
                    {processedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="#ffffff" strokeWidth={2} />
                    ))}
                </Pie>
                <Tooltip 
                     formatter={(value: number, name: string) => {
                         const total = processedData.reduce((a, b) => a + b.value, 0);
                         const percent = ((value / total) * 100).toFixed(1) + '%';
                         return [
                             <div key="tt" className="flex flex-col">
                                 <span className="font-semibold">{new Intl.NumberFormat('en').format(value)}</span>
                                 <span className="text-xs opacity-80">({percent} of total)</span>
                             </div>,
                             formatLabel(name)
                         ];
                     }}
                     contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     itemStyle={{ color: '#1e293b' }}
                />
                {viewOptions.showLegend && (
                    <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                        formatter={(value) => {
                            const formatted = formatLabel(value);
                            return formatted.length > 20 ? formatted.substring(0, 18) + '...' : formatted;
                        }}
                    />
                )}
            </PieChart>
        </ResponsiveContainer>
    );
};