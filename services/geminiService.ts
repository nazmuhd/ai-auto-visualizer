

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DataRow, ChartConfig, ChartType, AggregationType, KpiConfig } from '../types';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- 1. Premade Chart Templates Library ---
const CHART_TEMPLATES: Record<string, any> = {
    'tmpl_bar_comparison': { type: 'bar', defaultTitle: 'Ranked Comparison', defaultDescription: 'Comparing top items by value to identify leaders.', allowedAggregations: ['sum', 'average', 'count'] },
    'tmpl_line_trend': { type: 'line', defaultTitle: 'Trend Over Time', defaultDescription: 'Tracking key metrics over a time period.', allowedAggregations: ['sum', 'average', 'count'] },
    'tmpl_area_volume': { type: 'area', defaultTitle: 'Volume Trend', defaultDescription: 'Visualizing the magnitude of cumulative change.', allowedAggregations: ['sum'] },
    'tmpl_pie_distribution': { type: 'pie', defaultTitle: 'Proportional Distribution', defaultDescription: 'Showing how the total is divided among categories.', allowedAggregations: ['sum', 'count'] },
    'tmpl_scatter_correlation': { type: 'scatter', defaultTitle: 'Correlation Analysis', defaultDescription: 'Investigating the relationship between two numerical variables.' }
};

// --- 2. Optimized Schema for Template Matching ---
// FIX: The `Schema` type is not exported from @google/genai. Let TypeScript infer the type.
const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.ARRAY,
            description: "Executive summary as a list of 3-4 distinct, high-value bullet points.",
            items: { type: Type.STRING }
        },
        kpis: {
            type: Type.ARRAY,
            description: "Exactly 3 key performance indicators to display at the top.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "User-friendly title (e.g., 'Total Revenue')." },
                    column: { type: Type.STRING, description: "Exact column name to calculate from." },
                    operation: { type: Type.STRING, enum: ['sum', 'average', 'count_distinct'], description: "Aggregation method." },
                    format: { type: Type.STRING, enum: ['number', 'currency', 'percent'], description: "Best display format for this metric." }
                },
                required: ['title', 'column', 'operation', 'format']
            }
        },
        recommendedCharts: {
            type: Type.ARRAY,
            description: "Exactly 4 chart configurations matching data to templates.",
            items: {
                type: Type.OBJECT,
                properties: {
                    templateId: { type: Type.STRING, enum: Object.keys(CHART_TEMPLATES) },
                    titleOverride: { type: Type.STRING, nullable: true },
                    insightDescription: { type: Type.STRING, nullable: true },
                    mapping: {
                        type: Type.OBJECT,
                        properties: {
                            x: { type: Type.STRING },
                            y: { type: Type.STRING },
                            color: { type: Type.STRING, nullable: true },
                            aggregation: { type: Type.STRING, enum: ['sum', 'average', 'count', 'none'], nullable: true }
                        },
                        required: ['x', 'y']
                    }
                },
                required: ['templateId', 'mapping']
            }
        }
    },
    required: ['summary', 'kpis', 'recommendedCharts']
};

export const analyzeData = async (sample: DataRow[]): Promise<AnalysisResult> => {
    const dataStr = JSON.stringify(sample);
    let columnsInfo = "Unknown";
    if (sample.length > 0) {
        const firstRow = sample.find(row => Object.values(row).some(v => v !== null)) || sample[0];
        columnsInfo = Object.entries(firstRow)
            .map(([key, val]) => {
                let type: string = typeof val;
                if (type === 'string' && !isNaN(Date.parse(val)) && isNaN(Number(val))) type = 'date/time';
                else if (type === 'number' || (type === 'string' && !isNaN(Number(val)))) type = 'numeric';
                return `${key} (${type})`;
            })
            .join(', ');
    }

    const prompt = `
    ROLE: Expert Business Analyst.
    TASK: Analyze the provided data sample to generate a dashboard configuration.

    INPUT DATA SAMPLE (JSON):
    ${dataStr}

    DETECTED COLUMNS:
    ${columnsInfo}

    REQUIREMENTS:
    1. SUMMARY: Provide 3-4 clear, actionable bullet points summarizing key trends or outliers.
    2. KPIs: Identify exactly 3 Key Performance Indicators (KPIs) that are most important for this dataset. Define HOW to calculate them (e.g., SUM of 'Revenue', AVERAGE of 'CSAT', COUNT_DISTINCT of 'OrderID').
    3. CHARTS: Map the data to exactly 4 diverse chart templates that reveal different aspects of the data.

    AVAILABLE CHART TEMPLATES:
    - tmpl_bar_comparison (Good for: Ranking)
    - tmpl_line_trend (Good for: Time series)
    - tmpl_area_volume (Good for: Cumulative totals)
    - tmpl_pie_distribution (Good for: Part-to-whole, <10 categories)
    - tmpl_scatter_correlation (Good for: Numeric relationships)
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisSchema,
                temperature: 0.2,
            }
        });

        if (!response.text) throw new Error("Gemini returned an empty response.");
        const rawResult = JSON.parse(response.text) as any;

        const finalCharts: ChartConfig[] = [];
        const availableColumns = sample.length > 0 ? Object.keys(sample[0]) : [];

        if (rawResult.recommendedCharts && Array.isArray(rawResult.recommendedCharts)) {
             rawResult.recommendedCharts.forEach((rec: any, index: number) => {
                const tmpl = CHART_TEMPLATES[rec.templateId];
                if (!tmpl) return;
                if (!availableColumns.includes(rec.mapping.x) || !availableColumns.includes(rec.mapping.y)) return;

                finalCharts.push({
                    id: `chart_${index}_${rec.templateId}`,
                    type: tmpl.type,
                    title: rec.titleOverride || tmpl.defaultTitle,
                    description: rec.insightDescription || tmpl.defaultDescription,
                    mapping: rec.mapping
                });
            });
        }

        // Fallbacks
        const finalSummary = Array.isArray(rawResult.summary) ? rawResult.summary : ["Analysis complete."];
        const finalKpis = Array.isArray(rawResult.kpis) ? rawResult.kpis : [];

        if (finalCharts.length === 0 && availableColumns.length >= 2) {
             finalCharts.push({
                 id: 'fallback_chart', type: 'bar', title: 'Data Overview', description: 'Automatic fallback chart.',
                 mapping: { x: availableColumns[0], y: availableColumns[1], aggregation: 'count' }
             });
        }

        return {
            summary: finalSummary,
            kpis: finalKpis,
            charts: finalCharts.slice(0, 6)
        };

    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw new Error("Failed to analyze data. Please try again.");
    }
};