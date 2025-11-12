import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DataRow, ChartMapping } from '../../types.ts';
import { ViewOptions } from './ChartRenderer.tsx';

interface Props {
  data: DataRow[];
  mapping: ChartMapping;
  viewOptions: ViewOptions;
  colors: string[];
}

// FIX: Added a new component for Combo charts to handle dual-axis rendering.
export const RechartsComboChart: React.FC<Props> = ({ data, mapping, viewOptions, colors }) => {
  const processedData = useMemo(() => {
    // This assumes data is structured with one X-axis column and two Y-axis columns.
    // The first Y-axis column from the mapping is treated as the Bar, the second as the Line.
    // This logic may need refinement based on how the AI provides dual-Y mappings.
    return data.map(row => ({
      ...row,
      [mapping.y]: Number(row[mapping.y]),
      // Assuming the second metric is stored in the 'color' field for now
      // This is a simplification; a more robust solution would adapt the 'mapping' type.
      lineData: Number(row[mapping.color as any]),
    }));
  }, [data, mapping]);
  
  const lineMetricName = mapping.color || 'Metric 2';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={processedData}
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        {viewOptions.showGrid && <CartesianGrid stroke="#f5f5f5" />}
        <XAxis dataKey={mapping.x} scale="band" tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis yAxisId="left" orientation="left" stroke={colors[0]} tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis yAxisId="right" orientation="right" stroke={colors[1]} tick={{ fontSize: 11, fill: '#64748b' }} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
        />
        {viewOptions.showLegend && <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>}
        <Bar dataKey={mapping.y} name={mapping.y} barSize={20} fill={colors[0]} yAxisId="left" />
        <Line type="monotone" dataKey="lineData" name={lineMetricName} stroke={colors[1]} yAxisId="right" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
