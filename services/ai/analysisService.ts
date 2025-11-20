
import { Type } from "@google/genai";
import { AnalysisResult, DataRow, ChartConfig, KpiConfig } from '../../types.ts';
import { PromptBuilder } from '../../lib/prompt-builder.ts';
import { generateStructuredContent } from './resilience.ts';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { ai } from "./client.ts"; // Still needed for simple text calls like insights

// --- 1. Premade Chart Templates Library ---
export const CHART_TEMPLATES: Record<string, any> = {
    'tmpl_bar_comparison': { type: 'bar', defaultTitle: 'Ranked Comparison', defaultDescription: 'Comparing top items by value to identify leaders.', allowedAggregations: ['sum', 'average', 'count'] },
    'tmpl_line_trend': { type: 'line', defaultTitle: 'Trend Over Time', defaultDescription: 'Tracking key metrics over a time period.', allowedAggregations: ['sum', 'average', 'count'] },
    'tmpl_area_volume': { type: 'area', defaultTitle: 'Volume Trend', defaultDescription: 'Visualizing the magnitude of cumulative change.', allowedAggregations: ['sum'] },
    'tmpl_pie_distribution': { type: 'pie', defaultTitle: 'Proportional Distribution', defaultDescription: 'Showing how the total is divided among categories.', allowedAggregations: ['sum', 'count'] },
    'tmpl_scatter_correlation': { type: 'scatter', defaultTitle: 'Correlation Analysis', defaultDescription: 'Investigating the relationship between two numerical variables.' },
    'tmpl_stacked_bar': { type: 'stacked-bar', defaultTitle: 'Composition Over Category', defaultDescription: 'Showing how a total is divided into parts across categories.', allowedAggregations: ['sum', 'count'] },
    'tmpl_combo_line_bar': { type: 'combo', defaultTitle: 'Dual Metric Analysis', defaultDescription: 'Comparing two different metrics across a shared category.', allowedAggregations: ['sum', 'count', 'average'] },
    'tmpl_bubble_plot': { type: 'bubble', defaultTitle: 'Multi-dimensional Analysis', defaultDescription: 'Relating three numerical variables simultaneously.' }
};

// --- 2. Gemini Schema (for API Config) ---
const analysisGeminiSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        kpis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    column: { type: Type.STRING },
                    operation: { type: Type.STRING, enum: ['sum', 'average', 'count_distinct'] },
                    format: { type: Type.STRING, enum: ['number', 'currency', 'percent'] },
                    trendDirection: { type: Type.STRING, enum: ['higher-is-better', 'lower-is-better'] },
                    primaryCategory: { type: Type.STRING, nullable: true },
                    primaryCategoryValue: { type: Type.STRING, nullable: true }
                },
                required: ['title', 'column', 'operation', 'format', 'trendDirection']
            }
        },
        recommendedCharts: {
            type: Type.ARRAY,
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
                            z: { type: Type.STRING, nullable: true },
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

// --- 3. Zod Schema (for Runtime Validation) ---
// Note: This matches the Gemini schema structure but uses Zod for enforcement.
const zKpi = z.object({
    title: z.string(),
    column: z.string(),
    operation: z.enum(['sum', 'average', 'count_distinct']),
    format: z.enum(['number', 'currency', 'percent']),
    trendDirection: z.enum(['higher-is-better', 'lower-is-better']).optional(),
    primaryCategory: z.string().optional().nullable(),
    primaryCategoryValue: z.string().optional().nullable(),
});

const zChartRec = z.object({
    templateId: z.string(), // We validate existence in code
    titleOverride: z.string().optional().nullable(),
    insightDescription: z.string().optional().nullable(),
    mapping: z.object({
        x: z.string(),
        y: z.string(),
        z: z.string().optional().nullable(),
        color: z.string().optional().nullable(),
        aggregation: z.enum(['sum', 'average', 'count', 'none']).optional().nullable()
    })
});

const zAnalysisResult = z.object({
    summary: z.array(z.string()),
    kpis: z.array(zKpi),
    recommendedCharts: z.array(zChartRec)
});

type AnalysisAIResponse = z.infer<typeof zAnalysisResult>;

export const analyzeData = async (sample: DataRow[]): Promise<AnalysisResult> => {
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

    const prompt = new PromptBuilder('Expert Business Analyst')
        .setTask('Analyze the provided data sample to generate a dashboard configuration.')
        .addContext('DETECTED COLUMNS', columnsInfo)
        .addData('INPUT DATA SAMPLE (JSON)', sample)
        .addContext('REQUIREMENTS', `
            1. SUMMARY: Provide 3-4 clear, actionable bullet points summarizing key trends or outliers.
            2. KPIs: Identify between 5 and 10 KPIs. For each KPI:
                - Define HOW to calculate it (e.g., SUM of 'Revenue').
                - Determine trend direction: Is a higher value better or worse?
                - If a KPI represents a specific segment (e.g., "Sales - North America"), identify its category column and value.
            3. CHARTS: Map the data to a diverse set of between 5 and 8 chart templates.
        `)
        .addContext('AVAILABLE CHART TEMPLATES', `
            - tmpl_bar_comparison (Good for: Ranking)
            - tmpl_line_trend (Good for: Time series)
            - tmpl_area_volume (Good for: Cumulative totals over time)
            - tmpl_pie_distribution (Good for: Part-to-whole, <10 categories)
            - tmpl_scatter_correlation (Good for: Numeric relationships)
            - tmpl_stacked_bar (Good for: Composition across categories. Requires 'color' mapping.)
            - tmpl_combo_line_bar (Good for: Comparing two different Y metrics. The line and bar must share the same X-axis.)
            - tmpl_bubble_plot (Good for: 3 numeric variables. Requires 'z' mapping for bubble size.)
        `)
        .build();

    try {
        // Use the resilience layer
        const rawResult = await generateStructuredContent<AnalysisAIResponse>(
            'gemini-2.5-flash',
            prompt,
            analysisGeminiSchema,
            zAnalysisResult
        );

        const finalCharts: ChartConfig[] = [];
        const availableColumns = sample.length > 0 ? Object.keys(sample[0]) : [];

        if (rawResult.recommendedCharts && Array.isArray(rawResult.recommendedCharts)) {
             rawResult.recommendedCharts.forEach((rec, index) => {
                const tmpl = CHART_TEMPLATES[rec.templateId];
                if (!tmpl) return; // Skip invalid templates
                if (!availableColumns.includes(rec.mapping.x) || !availableColumns.includes(rec.mapping.y)) return;

                const validatedMapping = { ...rec.mapping };
                if (validatedMapping.color && !availableColumns.includes(validatedMapping.color)) validatedMapping.color = undefined;
                if (validatedMapping.z && !availableColumns.includes(validatedMapping.z)) validatedMapping.z = undefined;
                
                // For stacked bar, color is essential.
                if (tmpl.type === 'stacked-bar' && !validatedMapping.color) return;

                finalCharts.push({
                    id: `chart_${index}_${rec.templateId}`,
                    type: tmpl.type,
                    title: rec.titleOverride || tmpl.defaultTitle,
                    description: rec.insightDescription || tmpl.defaultDescription,
                    mapping: validatedMapping as any // Type assertion safe due to validation above
                });
            });
        }
        
        const finalKpis: KpiConfig[] = (rawResult.kpis || []).map(kpi => ({
            ...kpi, 
            id: uuidv4(),
            isCustom: false,
            visible: true
        }));

        // Fallbacks
        const finalSummary = rawResult.summary.length > 0 ? rawResult.summary : ["Analysis complete."];
        if (finalKpis.length < 3 && availableColumns.length > 0) {
            finalKpis.push({ id: uuidv4(), title: 'Total Rows', column: availableColumns[0], operation: 'count_distinct', format: 'number', trendDirection: 'higher-is-better', visible: true });
        }

        if (finalCharts.length === 0 && availableColumns.length >= 2) {
             finalCharts.push({
                 id: 'fallback_chart', type: 'bar', title: 'Data Overview', description: 'Automatic fallback chart.',
                 mapping: { x: availableColumns[0], y: availableColumns[1], aggregation: 'count' },
                 visible: true
             });
        }

        return {
            summary: finalSummary,
            kpis: finalKpis,
            charts: finalCharts
        };

    } catch (error: any) {
        console.error("Gemini Analysis Error:", error);
        // Re-throw with a user-friendly message, or the original message if it's from our resilience layer
        if (error.message.includes("Schema validation failed") || error.message.includes("AI Generation failed")) {
            throw error;
        }
        throw new Error("Failed to analyze data. The AI model could not process the structure.");
    }
};

export const generateChartInsight = async (chart: ChartConfig, data: DataRow[], promptType: 'summary' | 'insights'): Promise<string> => {
    // PromptBuilder handles truncation internally
    const prompt = new PromptBuilder('Expert Data Analyst')
        .setTask(promptType === 'summary' 
            ? "Write a concise, one-paragraph summary of the key takeaway from this chart."
            : "List 2-3 bullet points of the most important insights revealed by this chart. Be specific and reference data points if possible."
        )
        .addContext('CHART CONTEXT', JSON.stringify({
            title: chart.title,
            type: chart.type,
            description: chart.description,
            xAxis: chart.mapping.x,
            yAxis: chart.mapping.y,
            colorSeries: chart.mapping.color,
        }))
        .addData('DATA SAMPLE', data)
        .addContext('OUTPUT', 'Provide only the text for the summary or bullet points. Do not include any headers.')
        .build();

    try {
        // Simple text generation doesn't need structured resilience, 
        // but we still wrap it to be safe against basic failures
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.4 }
        });
        if (!response.text) throw new Error("AI returned an empty response.");
        return response.text;
    } catch (error) {
        console.error("Gemini Chart Insight Error:", error);
        throw new Error("Failed to generate insights for the chart.");
    }
};
