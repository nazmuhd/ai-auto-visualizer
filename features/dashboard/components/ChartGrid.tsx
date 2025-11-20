import React, { memo } from 'react';
import { ChartConfig, DataRow } from '../../../types.ts';
import { ChartRenderer, TimeFilterPreset } from '../../../components/charts/ChartRenderer.tsx';

interface Props {
    chartRows: ChartConfig[][];
    getGridColsClass: (count: number) => string;
    dataSource: { data: DataRow[] };
    allData: DataRow[];
    dateColumn: string | null;
    onChartUpdate: (updatedChart: ChartConfig) => void;
    onSetMaximizedChart: (chart: ChartConfig | null) => void;
    onGlobalFilterChange: (column: string, values: Set<string>) => void;
    onTimeFilterChange: (filter: { type: TimeFilterPreset; start?: string; end?: string }) => void;
    globalFilters: Record<string, Set<string>>;
    timeFilter: { type: TimeFilterPreset; start?: string; end?: string };
}

export const ChartGrid: React.FC<Props> = memo(({ 
    chartRows, 
    getGridColsClass, 
    dataSource, 
    allData, 
    dateColumn, 
    onChartUpdate, 
    onSetMaximizedChart, 
    onGlobalFilterChange, 
    onTimeFilterChange, 
    globalFilters, 
    timeFilter 
}) => (
    <section>
        {chartRows.map((row, rowIndex) => (
            <div key={rowIndex} className={`grid grid-cols-1 ${getGridColsClass(row.length)} gap-6 lg:gap-8 mb-6 lg:mb-8`}>
                {row.map(chart => (
                    <div key={chart.id} className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px]">
                        <ChartRenderer 
                            config={chart} 
                            data={dataSource.data} 
                            allData={allData} 
                            dateColumn={dateColumn} 
                            onUpdate={onChartUpdate} 
                            onMaximize={onSetMaximizedChart} 
                            enableScrollZoom={true} 
                            onFilterChange={onGlobalFilterChange} 
                            onTimeFilterChange={onTimeFilterChange} 
                            activeFilters={globalFilters} 
                            activeTimeFilter={timeFilter}
                        />
                    </div>
                ))}
            </div>
        ))}
    </section>
));
