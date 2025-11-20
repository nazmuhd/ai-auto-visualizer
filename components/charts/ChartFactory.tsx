
import React, { useMemo } from 'react';
import { ChartType, DataRow, ChartMapping } from '../../types.ts';
import { ViewOptions } from './ChartRenderer.tsx';
import { RechartsBarChart } from './RechartsBarChart.tsx';
import { RechartsLineChart } from './RechartsLineChart.tsx';
import { RechartsPieChart } from './RechartsPieChart.tsx';
import { RechartsScatterChart } from './RechartsScatterChart.tsx';
import { RechartsComboChart } from './RechartsComboChart.tsx';
import { BarChart, PieChart, LineChart, ScatterChart, AreaChart } from 'lucide-react';

interface ChartFactoryProps {
    type: ChartType;
    data: DataRow[];
    mapping: ChartMapping;
    viewOptions: ViewOptions;
    colors: string[];
    formatLabel: (label: string) => string;
    enableScrollZoom?: boolean;
    timeGrain?: any;
}

// Metadata for chart types (labels, icons, recommendations)
export const CHART_METADATA: Record<string, { label: string, icon: React.ElementType, recommendedFor: (x: any, y: any) => boolean }> = {
    'bar': { 
        label: 'Bar Chart', 
        icon: BarChart, 
        recommendedFor: (x, y) => true // Default
    },
    'stacked-bar': { 
        label: 'Stacked Bar', 
        icon: BarChart, 
        recommendedFor: (x, y) => false 
    },
    'line': { 
        label: 'Line Chart', 
        icon: LineChart, 
        recommendedFor: (x, y) => !isNaN(Date.parse(x)) || !isNaN(Number(x)) 
    },
    'area': { 
        label: 'Area Chart', 
        icon: AreaChart, 
        recommendedFor: (x, y) => !isNaN(Date.parse(x)) 
    },
    'pie': { 
        label: 'Pie Chart', 
        icon: PieChart, 
        recommendedFor: (x, y) => isNaN(Number(x)) && isNaN(Date.parse(x)) 
    },
    'scatter': { 
        label: 'Scatter Plot', 
        icon: ScatterChart, 
        recommendedFor: (x, y) => !isNaN(Number(x)) && !isNaN(Number(y)) 
    },
    'bubble': { 
        label: 'Bubble Chart', 
        icon: ScatterChart, 
        recommendedFor: (x, y) => !isNaN(Number(x)) && !isNaN(Number(y)) 
    },
    'combo': { 
        label: 'Combo Chart', 
        icon: BarChart, 
        recommendedFor: (x, y) => false 
    }
};

export const ChartFactory: React.FC<ChartFactoryProps> = ({ 
    type, 
    data, 
    mapping, 
    viewOptions, 
    colors, 
    formatLabel,
    enableScrollZoom,
    timeGrain = 'daily'
}) => {
    switch (type) {
        case 'bar': 
            return <RechartsBarChart data={data} mapping={mapping} viewOptions={viewOptions} colors={colors} formatLabel={formatLabel} />;
        case 'stacked-bar': 
            return <RechartsBarChart data={data} mapping={mapping} viewOptions={viewOptions} isStacked={true} colors={colors} formatLabel={formatLabel} />;
        case 'line': 
            return <RechartsLineChart data={data} mapping={mapping} viewOptions={viewOptions} colors={colors} timeGrain={timeGrain} enableScrollZoom={enableScrollZoom} formatLabel={formatLabel} />;
        case 'area': 
            return <RechartsLineChart data={data} mapping={mapping} isArea={true} viewOptions={viewOptions} colors={colors} timeGrain={timeGrain} enableScrollZoom={enableScrollZoom} formatLabel={formatLabel} />;
        case 'pie': 
            return <RechartsPieChart data={data} mapping={mapping} viewOptions={viewOptions} colors={colors} formatLabel={formatLabel} />;
        case 'scatter': 
            return <RechartsScatterChart data={data} mapping={mapping} viewOptions={viewOptions} colors={colors} enableScrollZoom={enableScrollZoom} formatLabel={formatLabel} />;
        case 'bubble': 
            return <RechartsScatterChart data={data} mapping={mapping} isBubble={true} viewOptions={viewOptions} colors={colors} enableScrollZoom={enableScrollZoom} formatLabel={formatLabel} />;
        case 'combo': 
            return <RechartsComboChart data={data} mapping={mapping} viewOptions={viewOptions} colors={colors} />;
        default: 
            return <div className="flex items-center justify-center h-full text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">Unsupported chart type: {type}</div>;
    }
};
