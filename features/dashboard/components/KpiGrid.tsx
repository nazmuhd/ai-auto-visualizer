import React, { useMemo, memo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { KpiConfig, DataRow } from '../../../types.ts';

interface KpiCardProps {
    kpi: KpiConfig;
    value: number | null;
    trend: number | null;
    sparklineData: { name: string; value: number }[];
    onClick: () => void;
}

const KpiCard: React.FC<KpiCardProps> = memo(({ kpi, value, trend, sparklineData, onClick }) => {
    const trendColor = trend === null ? 'slate' : trend > 0 ? (kpi.trendDirection === 'higher-is-better' ? 'green' : 'red') : trend < 0 ? (kpi.trendDirection === 'higher-is-better' ? 'red' : 'green') : 'slate';
    const TrendIcon = trend === null ? Minus : trend > 0 ? TrendingUp : TrendingDown;
    const formattedValue = new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(value ?? 0);

    return (
        <div onClick={onClick} className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden group hover:shadow-lg hover:-translate-y-1 hover:border-primary-300 ${trendColor === 'green' ? 'bg-green-50/40 border-green-200/60' : trendColor === 'red' ? 'bg-red-50/40 border-red-200/60' : 'bg-white border-slate-200/80 shadow-sm'}`}>
            <p className="text-sm font-medium text-slate-500 mb-1 truncate" title={kpi.title}>{kpi.title}</p>
            <p className="text-3xl font-bold text-slate-900">{formattedValue}</p>
            {trend !== null && (
                 <div className={`mt-1 flex items-center text-sm font-semibold text-${trendColor}-600`}>
                    <TrendIcon size={16} className="mr-1"/>
                    <span>{Math.abs(trend).toFixed(1)}%</span>
                    <span className="text-xs text-slate-400 font-normal ml-1.5">vs last period</span>
                </div>
            )}
             {sparklineData.length > 1 && (
                <div className="absolute bottom-0 right-0 h-1/2 w-2/3 opacity-30 group-hover:opacity-60 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                            <Line type="monotone" dataKey="value" stroke={trendColor === 'green' ? '#10b981' : trendColor === 'red' ? '#ef4444' : '#64748b'} strokeWidth={2} dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
});

interface KpiGridProps {
    kpis: KpiConfig[];
    data: DataRow[];
    dateColumn: string | null;
    onKpiClick: (kpi: KpiConfig) => void;
}

export const KpiGrid: React.FC<KpiGridProps> = memo(({ kpis, data, dateColumn, onKpiClick }) => {
    const kpiValues = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        let historicalData: Record<string, DataRow[]> = {};
        if (dateColumn) {
             const sortedData = [...data].sort((a,b) => new Date(a[dateColumn]).getTime() - new Date(b[dateColumn]).getTime());
             sortedData.forEach(row => {
                try {
                    const date = new Date(row[dateColumn]);
                    if(isNaN(date.getTime())) return;
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if(!historicalData[monthKey]) historicalData[monthKey] = [];
                    historicalData[monthKey].push(row);
                } catch(e) {}
             });
        }
        const periods = Object.keys(historicalData).sort();
        const lastPeriodKey = periods[periods.length - 1];
        const prevPeriodKey = periods[periods.length - 2];

        return kpis.map(kpi => {
            const calculateValue = (dataset: DataRow[]) => {
                if(!dataset || dataset.length === 0) return 0;
                let filteredData = dataset;
                if(kpi.primaryCategory && kpi.primaryCategoryValue) {
                    filteredData = dataset.filter(r => String(r[kpi.primaryCategory!]) === kpi.primaryCategoryValue);
                }
                
                let baseValue = 0;
                if(kpi.operation === 'sum') baseValue = filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0);
                else if(kpi.operation === 'average') baseValue = filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0) / (filteredData.length || 1);
                else if (kpi.operation === 'count_distinct') {
                    const values = filteredData.map(row => row[kpi.column]);
                    baseValue = new Set(values).size;
                }
                
                return baseValue * (kpi.multiplier || 1);
            };

            const currentValue = calculateValue(data);
            let trend: number | null = null;
            if(lastPeriodKey && prevPeriodKey) {
                const lastPeriodValue = calculateValue(historicalData[lastPeriodKey]);
                const prevPeriodValue = calculateValue(historicalData[prevPeriodKey]);
                if(prevPeriodValue !== 0) {
                    trend = ((lastPeriodValue - prevPeriodValue) / prevPeriodValue) * 100;
                }
            }

            const sparklineData = periods.slice(-12).map(p => ({name: p, value: calculateValue(historicalData[p])}));
            
            return { ...kpi, displayValue: currentValue, trend, sparklineData };
        });
    }, [kpis, data, dateColumn]);

    if (kpiValues.length === 0) return null;
    return (
        <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Key Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {kpiValues.map(kpi => <KpiCard key={kpi.id} kpi={kpi} value={kpi.displayValue} trend={kpi.trend} sparklineData={kpi.sparklineData} onClick={() => onKpiClick(kpi)} />)}
            </div>
        </section>
    );
});
