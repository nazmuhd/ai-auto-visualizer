import React, { useMemo } from 'react';
import { AnalysisResult, DataRow, ChartConfig, KpiConfig } from '../types';
import { ChartRenderer } from './charts/ChartRenderer';
import { Sparkles, RefreshCcw, DollarSign, Hash, Activity } from 'lucide-react';

interface Props {
    data: DataRow[];
    analysis: AnalysisResult;
    onReset: () => void;
    onUpdateChart: (updatedConfig: ChartConfig) => void;
}

export const Dashboard: React.FC<Props> = ({ data, analysis, onReset, onUpdateChart }) => {
    // --- 1. Automatically detect the best Date column for time filtering ---
    const dateColumn = useMemo(() => {
        if (!data || data.length === 0) return null;
        const columns = Object.keys(data[0]);
        // Look for a column that actually looks like a date and isn't just a number
        return columns.find(col => {
            const sample = data.find(row => row[col] !== null && row[col] !== undefined);
             if (!sample) return false;
             const val = sample[col];
             // Check if it parses as a date AND is NOT just a pure number (like an ID)
             return !isNaN(Date.parse(String(val))) && isNaN(Number(val));
        }) || null;
    }, [data]);

    // --- KPI Calculation Logic (Uses ALL data now, as filtering is per-chart) ---
    const kpiValues = useMemo(() => {
        return analysis.kpis.map(kpi => {
            let value = 0;
            const col = kpi.column;
            const dataset = data; // KPIs currently show global totals

            if (kpi.operation === 'sum') {
                value = dataset.reduce((acc, row) => acc + (Number(row[col]) || 0), 0);
            } else if (kpi.operation === 'average') {
                const sum = dataset.reduce((acc, row) => acc + (Number(row[col]) || 0), 0);
                value = sum / (dataset.length || 1);
            } else if (kpi.operation === 'count_distinct') {
                const unique = new Set(dataset.map(row => row[col]));
                value = unique.size;
            }

            // Formatting
            let formattedValue = new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(value);
            if (kpi.format === 'currency') {
                 formattedValue = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: 'compact' }).format(value);
            } else if (kpi.format === 'percent') {
                 formattedValue = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 1 }).format(value / 100);
            }

            return { ...kpi, displayValue: formattedValue };
        });
    }, [data, analysis.kpis]);

    const getKpiIcon = (kpi: KpiConfig) => {
        if (kpi.format === 'currency') return <DollarSign className="h-5 w-5 text-emerald-600" />;
        if (kpi.operation === 'count_distinct') return <Hash className="h-5 w-5 text-blue-600" />;
        return <Activity className="h-5 w-5 text-violet-600" />;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="bg-primary-600 text-white p-2 rounded-lg mr-3">
                            <Sparkles size={20} className="fill-primary-400 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">
                            AI Insights Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onReset}
                            className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <RefreshCcw size={16} className="mr-2" />
                            Analyze New File
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* KPI Section */}
                {kpiValues.length > 0 && (
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {kpiValues.map((kpi, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">{kpi.title}</p>
                                    <p className="text-3xl font-bold text-slate-900">{kpi.displayValue}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    {getKpiIcon(kpi)}
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* Executive Summary */}
                {analysis.summary && analysis.summary.length > 0 && (
                    <section className="mb-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
                        <div className="flex items-center mb-6">
                            <Sparkles className="text-primary-600 mr-3" size={24} />
                            <h2 className="text-2xl font-bold text-slate-900">Executive Summary</h2>
                        </div>
                        <ul className="space-y-4">
                            {analysis.summary.map((point, idx) => (
                                <li key={idx} className="flex items-start">
                                    <span className="inline-block w-2 h-2 rounded-full bg-primary-500 mt-2 mr-3 flex-shrink-0" />
                                    <p className="text-slate-700 leading-relaxed text-lg">{point}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Charts Grid */}
                <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                    {analysis.charts.map((chartConfig) => (
                        <div key={chartConfig.id} className="h-[450px]">
                             <ChartRenderer 
                                config={chartConfig} 
                                data={data} 
                                dateColumn={dateColumn}
                                onUpdate={onUpdateChart} 
                            />
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
};
