
import React, { useMemo } from 'react';
import { Project, KpiConfig, DataRow, ChartMapping } from '../../../../types.ts';
import { X, BarChart3 } from 'lucide-react';
import { RechartsLineChart } from '../../../../components/charts/RechartsLineChart.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  kpi: KpiConfig | null;
  project: Project | null;
  dateColumn: string | null;
}

const calculateKpiValue = (dataset: DataRow[], kpi: KpiConfig): number => {
    if(!dataset || dataset.length === 0) return 0;
    
    let filteredData = dataset;
    if(kpi.primaryCategory && kpi.primaryCategoryValue) {
        filteredData = dataset.filter(r => String(r[kpi.primaryCategory!]) === kpi.primaryCategoryValue);
    }

    if(kpi.operation === 'sum') return filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0);
    if(kpi.operation === 'average') return filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0) / (filteredData.length || 1);
    if(kpi.operation === 'count_distinct') return new Set(filteredData.map(row => row[kpi.column])).size;
    return 0;
};

export const KpiDetailModal: React.FC<Props> = ({ isOpen, onClose, kpi, project, dateColumn }) => {
  if (!isOpen || !kpi || !project) return null;

  const { fullValue, historicalData } = useMemo(() => {
    const data = project.dataSource.data;
    const value = calculateKpiValue(data, kpi);

    let history: DataRow[] = [];
    if (dateColumn) {
        const groupedByMonth: Record<string, DataRow[]> = {};
        data.forEach(row => {
            try {
                const date = new Date(row[dateColumn!]);
                if(isNaN(date.getTime())) return;
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
                if(!groupedByMonth[monthKey]) groupedByMonth[monthKey] = [];
                groupedByMonth[monthKey].push(row);
            } catch(e) {}
        });

        history = Object.keys(groupedByMonth).sort().map(monthKey => {
            const monthData = groupedByMonth[monthKey];
            const monthValue = calculateKpiValue(monthData, kpi);
            return {
                [dateColumn]: new Date(monthKey),
                [kpi.column]: monthValue,
            };
        });
    }

    return { fullValue: value, historicalData: history };
  }, [kpi, project, dateColumn]);
  
  const relatedCharts = useMemo(() => {
    if (!project.analysis) return [];
    return project.analysis.charts.filter(chart => 
        chart.mapping.y === kpi.column && chart.visible
    );
  }, [kpi, project.analysis]);

  const formattedValue = new Intl.NumberFormat('en', {
    maximumFractionDigits: kpi.format === 'currency' ? 2 : 1,
    style: kpi.format === 'currency' ? 'currency' : 'decimal',
    currency: 'USD',
    notation: 'compact',
    compactDisplay: 'short'
  }).format(fullValue ?? 0);

  const chartMapping: ChartMapping = { x: dateColumn!, y: kpi.column, aggregation: 'none' };
  const viewOptions = { showGrid: true, showLegend: false, showLabels: false };
  const colors = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="kpi-detail-title" 
        className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 pb-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0 bg-white rounded-t-2xl">
          <div>
            <h3 id="kpi-detail-title" className="text-xl font-bold text-slate-900">{kpi.title}</h3>
            <p className="text-sm text-slate-500">{kpi.operation.replace('_', ' ')} of "{kpi.column}"</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <div className="text-center mb-6">
                <p className="text-5xl font-extrabold text-slate-900">{formattedValue}</p>
            </div>
            
            {dateColumn && historicalData.length > 1 ? (
                <section className="mb-8">
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Historical Trend</h4>
                    <div className="h-64 bg-white p-4 rounded-xl border border-slate-200">
                        <RechartsLineChart 
                            data={historicalData} 
                            mapping={chartMapping} 
                            viewOptions={viewOptions}
                            colors={colors}
                            timeGrain="monthly"
                            formatLabel={(l) => l}
                        />
                    </div>
                </section>
            ) : (
                 <div className="text-center text-slate-500 py-10">No historical data available to plot a trend.</div>
            )}
            
            {relatedCharts.length > 0 && (
                <section>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Related Charts</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {relatedCharts.map(chart => (
                            <div key={chart.id} className="p-4 bg-white rounded-lg border border-slate-200">
                                <div className="flex items-center text-primary-700 font-medium text-sm mb-1">
                                    <BarChart3 size={16} className="mr-2" />
                                    {chart.title}
                                </div>
                                <p className="text-xs text-slate-500">{chart.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

        </main>
        <footer className="p-4 border-t border-slate-200 flex justify-end flex-shrink-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm">Done</button>
        </footer>
      </div>
    </div>
  );
};
