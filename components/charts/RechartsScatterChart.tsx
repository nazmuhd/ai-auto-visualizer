
import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';
import { DataRow, ChartMapping } from '../../types.ts';
import { ViewOptions } from './ChartRenderer.tsx';
import { RotateCcw } from 'lucide-react';

interface Props {
    data: DataRow[];
    mapping: ChartMapping;
    viewOptions: ViewOptions;
    isBubble?: boolean;
    colors: string[];
    formatLabel: (label: string) => string;
    enableScrollZoom?: boolean;
}

const downsample = (data: any[], targetLimit: number) => {
    if (data.length <= targetLimit) return data;
    const step = Math.ceil(data.length / targetLimit);
    return data.filter((_, i) => i % step === 0);
};

export const RechartsScatterChart: React.FC<Props> = ({ data, mapping, viewOptions, isBubble = false, colors, formatLabel, enableScrollZoom = false }) => {
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
    
    const chartWrapperRef = useRef<HTMLDivElement>(null);
    const [zoomDomain, setZoomDomain] = useState<{ x: (number | undefined)[], y: (number | undefined)[] }>({ x: [undefined, undefined], y: [undefined, undefined] });
    const [chartKey, setChartKey] = useState(0);

    useEffect(() => {
        setZoomDomain({ x: [undefined, undefined], y: [undefined, undefined] });
    }, [processedData]);

    const originalDomain = useMemo(() => {
        if (processedData.length === 0) return { x: [0, 0], y: [0, 0] };
        const xVals = processedData.map(p => p[mapping.x] as number);
        const yVals = processedData.map(p => p[mapping.y] as number);
        return {
            x: [Math.min(...xVals), Math.max(...xVals)],
            y: [Math.min(...yVals), Math.max(...yVals)],
        };
    }, [processedData, mapping.x, mapping.y]);

    const handleWheelZoom = useCallback((e: WheelEvent) => {
        e.preventDefault();
        setZoomDomain(prevDomain => {
            const zoomFactor = 1.15;
            const [xMin, xMax] = prevDomain.x[0] !== undefined ? prevDomain.x as [number, number] : originalDomain.x;
            const [yMin, yMax] = prevDomain.y[0] !== undefined ? prevDomain.y as [number, number] : originalDomain.y;

            const xRange = xMax - xMin;
            const yRange = yMax - yMin;
            
            let newX, newY;

            if (e.deltaY < 0) { // Zoom in
                if (xRange < 1e-6 || yRange < 1e-6) return prevDomain; // Prevent over-zooming
                newX = [xMin + xRange * (1 - 1 / zoomFactor) / 2, xMax - xRange * (1 - 1 / zoomFactor) / 2];
                newY = [yMin + yRange * (1 - 1 / zoomFactor) / 2, yMax - yRange * (1 - 1 / zoomFactor) / 2];
            } else { // Zoom out
                newX = [xMin - xRange * (zoomFactor - 1) / 2, xMax + xRange * (zoomFactor - 1) / 2];
                newY = [yMin - yRange * (zoomFactor - 1) / 2, yMax + yRange * (zoomFactor - 1) / 2];
                // Clamp to original domain when zooming out
                newX[0] = Math.max(newX[0], originalDomain.x[0]);
                newX[1] = Math.min(newX[1], originalDomain.x[1]);
                newY[0] = Math.max(newY[0], originalDomain.y[0]);
                newY[1] = Math.min(newY[1], originalDomain.y[1]);
            }

            return { x: newX, y: newY };
        });
    }, [originalDomain]);

    const handleResetZoom = () => {
        setZoomDomain({ x: [undefined, undefined], y: [undefined, undefined] });
        setChartKey(k => k + 1);
    };

    useEffect(() => {
        const chartElement = chartWrapperRef.current;
        if (enableScrollZoom && chartElement) {
            chartElement.addEventListener('wheel', handleWheelZoom, { passive: false });
            return () => chartElement.removeEventListener('wheel', handleWheelZoom);
        }
    }, [enableScrollZoom, handleWheelZoom]);

    const isZoomed = zoomDomain.x[0] !== undefined;

    return (
        <div className="w-full h-full relative" ref={chartWrapperRef}>
             {isZoomed && enableScrollZoom && (
                <button onClick={handleResetZoom} className="absolute top-0 right-8 z-20 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-medium px-2.5 py-1 rounded-md flex items-center shadow-sm">
                    <RotateCcw size={12} className="mr-1.5"/> Reset Zoom
                </button>
            )}
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart key={chartKey} margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
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
                        tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)}
                        domain={zoomDomain.x as any}
                        allowDataOverflow
                    >
                        <Label value={formatLabel(mapping.x)} position="bottom" offset={0} style={{ textAnchor: 'middle', fill: '#94a3b8', fontSize: 12 }} />
                    </XAxis>
                    <YAxis 
                        type="number" 
                        dataKey={mapping.y} 
                        name={formatLabel(mapping.y)} 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact", compactDisplay: "short" }).format(value)}
                        domain={zoomDomain.y as any}
                        allowDataOverflow
                    >
                        <Label value={formatLabel(mapping.y)} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#94a3b8', fontSize: 12 }} />
                    </YAxis>
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
        </div>
    );
};
