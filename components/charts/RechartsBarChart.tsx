
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList, Cell, Label } from 'recharts';
import { DataRow, ChartMapping } from '../../types.ts';
import { ViewOptions } from './ChartRenderer.tsx';

interface Props {
    data: DataRow[];
    mapping: ChartMapping;
    viewOptions: ViewOptions;
    isStacked?: boolean;
    colors: string[];
    formatLabel: (label: string) => string;
    onCategoryClick?: (value: string | number) => void;
}

export const RechartsBarChart: React.FC<Props> = ({ data, mapping, viewOptions, isStacked = false, colors, formatLabel, onCategoryClick }) => {
    const { processedData, dataKeys, yAxisWidth, leftMargin } = useMemo(() => {
        if (!data || data.length === 0) return { processedData: [], dataKeys: [], yAxisWidth: 80, leftMargin: 20 };

        const aggMap = new Map<string, any>();
        const keys = mapping.color ? Array.from(new Set(data.map(row => String(row[mapping.color!])))) : [mapping.y];
        
        data.forEach(row => {
            const xKey = String(row[mapping.x] || 'Unknown');
            if (!aggMap.has(xKey)) aggMap.set(xKey, { [mapping.x]: xKey });
            
            const entry = aggMap.get(xKey)!;
            const yVal = Number(row[mapping.y]) || 0;
            const seriesKey = mapping.color ? String(row[mapping.color]) : mapping.y;

            entry[seriesKey] = (entry[seriesKey] || 0) + yVal;
        });

        let result = Array.from(aggMap.values());
        
        // Sort data for better presentation
        if (keys.length > 1) { // Multi-series
             result.sort((a, b) => {
                const totalA = keys.reduce((sum, k) => sum + (Number(a[k]) || 0), 0);
                const totalB = keys.reduce((sum, k) => sum + (Number(b[k]) || 0), 0);
                return totalB - totalA;
            });
        } else { // Single-series
             result.sort((a, b) => Number(b[mapping.y]) - Number(a[mapping.y]));
        }

        // Dynamically adjust Y-axis width based on label length to prevent overlap
        let maxLabelLength = 0;
        result.forEach(d => {
            const labelLength = String(d[mapping.x]).length;
            if (labelLength > maxLabelLength) maxLabelLength = labelLength;
        });
        
        const newYAxisWidth = Math.min(200, Math.max(80, maxLabelLength * 6));
        const newLeftMargin = Math.max(20, newYAxisWidth - 60);

        return { processedData: result, dataKeys: keys, yAxisWidth: newYAxisWidth, leftMargin: newLeftMargin };

    }, [data, mapping, isStacked]);

    const isSingleSeries = dataKeys.length === 1;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={processedData}
                margin={{ top: 20, right: 30, left: leftMargin, bottom: 30 }}
                layout="vertical"
            >
                {viewOptions.showGrid && (
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                )}
                <YAxis 
                    type="category"
                    dataKey={mapping.x} 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    interval={0}
                    width={yAxisWidth}
                    tickFormatter={(val) => {
                        const str = String(val);
                        return str.length > 30 ? str.substring(0, 27) + '...' : str;
                    }}
                />
                <XAxis 
                    type="number"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)}
                    domain={[0, 'dataMax']}
                >
                    <Label value={formatLabel(mapping.y)} position="bottom" offset={0} style={{ textAnchor: 'middle', fill: '#94a3b8', fontSize: 12 }} />
                </XAxis>
                <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    formatter={(value: number, name: string) => [new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value), formatLabel(name)]}
                />
                {viewOptions.showLegend && (
                    <Legend 
                        wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}
                        formatter={(value) => formatLabel(value)}
                    />
                )}
                {isSingleSeries ? (
                    <Bar 
                        dataKey={dataKeys[0]} 
                        radius={[0, 4, 4, 0]} 
                        maxBarSize={60}
                        cursor={onCategoryClick ? "pointer" : "default"}
                    >
                        {processedData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={colors[index % colors.length]} 
                                onClick={() => onCategoryClick && onCategoryClick(entry[mapping.x])}
                            />
                        ))}
                        {viewOptions.showLabels && (
                            <LabelList 
                                dataKey={dataKeys[0]} 
                                position="right" 
                                formatter={(val: number) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(val)}
                                style={{ fontSize: '10px', fill: '#64748b' }} 
                            />
                        )}
                    </Bar>
                ) : (
                    dataKeys.map((key, i) => (
                        <Bar 
                            key={key}
                            dataKey={key} 
                            fill={colors[i % colors.length]} 
                            radius={[0, 4, 4, 0]} 
                            maxBarSize={60}
                            stackId={isStacked ? "a" : undefined}
                            name={formatLabel(key)}
                            cursor={onCategoryClick ? "pointer" : "default"}
                            onClick={(data) => onCategoryClick && onCategoryClick(data[mapping.x])}
                        />
                    ))
                )}
            </BarChart>
        </ResponsiveContainer>
    );
};
