import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DataRow, ChartConfig, KpiConfig, TextBlock } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- 1. Premade Chart Templates Library ---
const CHART_TEMPLATES: Record<string, any> = {
    'tmpl_bar_comparison': { type: 'bar', defaultTitle: 'Ranked Comparison', defaultDescription: 'Comparing top items by value to identify leaders.', allowedAggregations: ['sum', 'average', 'count'] },
    'tmpl_line_trend': { type: 'line', defaultTitle: 'Trend Over Time', defaultDescription: 'Tracking key metrics over a time period.', allowedAggregations: ['sum', 'average', 'count'] },
    'tmpl_area_volume': { type: 'area', defaultTitle: 'Volume Trend', defaultDescription: 'Visualizing the magnitude of cumulative change.', allowedAggregations: ['sum'] },
    'tmpl_pie_distribution': { type: 'pie', defaultTitle: 'Proportional Distribution', defaultDescription: 'Showing how the total is divided among categories.', allowedAggregations: ['sum', 'count'] },
    'tmpl_scatter_correlation': { type: 'scatter', defaultTitle: 'Correlation Analysis', defaultDescription: 'Investigating the relationship between two numerical variables.' },
    'tmpl_stacked_bar': { type: 'stacked-bar', defaultTitle: 'Composition Over Category', defaultDescription: 'Showing how a total is divided into parts across categories.', allowedAggregations: ['sum', 'count'] },
    'tmpl_combo_line_bar': { type: 'combo', defaultTitle: 'Dual Metric Analysis', defaultDescription: 'Comparing two different metrics across a shared category.', allowedAggregations: ['sum', 'count', 'average'] },
    'tmpl_bubble_plot': { type: 'bubble', defaultTitle: 'Multi-dimensional Analysis', defaultDescription: 'Relating three numerical variables simultaneously.' }
};

// --- 2. Optimized Schema for Template Matching ---
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
            description: "Between 5 and 10 key performance indicators (KPIs) that are most critical to understanding this dataset. Prioritize strategic metrics.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "User-friendly title (e.g., 'Total Revenue')." },
                    column: { type: Type.STRING, description: "Exact column name to calculate from." },
                    operation: { type: Type.STRING, enum: ['sum', 'average', 'count_distinct'], description: "Aggregation method." },
                    format: { type: Type.STRING, enum: ['number', 'currency', 'percent'], description: "Best display format for this metric." },
                    trendDirection: { type: Type.STRING, enum: ['higher-is-better', 'lower-is-better'], description: "Is a higher value for this KPI generally good or bad?" },
                    primaryCategory: { type: Type.STRING, nullable: true, description: "If this KPI is a breakdown by a category (e.g., 'Sales for North America'), provide the category column name here (e.g., 'Region')." },
                    primaryCategoryValue: { type: Type.STRING, nullable: true, description: "If primaryCategory is set, provide the specific value for this KPI (e.g., 'North America')." }
                },
                required: ['title', 'column', 'operation', 'format', 'trendDirection']
            }
        },
        recommendedCharts: {
            type: Type.ARRAY,
            description: "Between 5 and 8 diverse chart configurations matching data to templates. Prioritize quality over quantity and aim for a variety of chart types.",
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
                            z: { type: Type.STRING, nullable: true, description: "For bubble charts, the column for bubble size." },
                            color: { type: Type.STRING, nullable: true, description: "For multi-series charts, the column for color category." },
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
    2. KPIs: Identify between 5 and 10 KPIs. For each KPI:
        - Define HOW to calculate it (e.g., SUM of 'Revenue').
        - Determine trend direction: Is a higher value better or worse? (e.g., higher revenue is good, higher costs are bad).
        - If a KPI represents a specific segment (e.g., "Sales - North America"), identify its category column (e.g., 'Region') and its value (e.g., 'North America').
    3. CHARTS: Map the data to a diverse set of between 5 and 8 chart templates that reveal different aspects of the data. Choose the most insightful charts.

    AVAILABLE CHART TEMPLATES:
    - tmpl_bar_comparison (Good for: Ranking)
    - tmpl_line_trend (Good for: Time series)
    - tmpl_area_volume (Good for: Cumulative totals over time)
    - tmpl_pie_distribution (Good for: Part-to-whole, <10 categories)
    - tmpl_scatter_correlation (Good for: Numeric relationships)
    - tmpl_stacked_bar (Good for: Composition across categories. Requires 'color' mapping.)
    - tmpl_combo_line_bar (Good for: Comparing two different Y metrics. The line and bar must share the same X-axis.)
    - tmpl_bubble_plot (Good for: 3 numeric variables. Requires 'z' mapping for bubble size.)
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

                const validatedMapping = { ...rec.mapping };
                if (validatedMapping.color && !availableColumns.includes(validatedMapping.color)) validatedMapping.color = undefined;
                if (validatedMapping.z && !availableColumns.includes(validatedMapping.z)) validatedMapping.z = undefined;
                
                // For stacked bar, color is essential. If AI misses it, don't create the chart.
                if (tmpl.type === 'stacked-bar' && !validatedMapping.color) return;

                finalCharts.push({
                    id: `chart_${index}_${rec.templateId}`,
                    type: tmpl.type,
                    title: rec.titleOverride || tmpl.defaultTitle,
                    description: rec.insightDescription || tmpl.defaultDescription,
                    mapping: validatedMapping
                });
            });
        }
        
        const finalKpis: KpiConfig[] = (Array.isArray(rawResult.kpis) ? rawResult.kpis : []).map(kpi => ({...kpi, id: uuidv4()}));


        // Fallbacks
        const finalSummary = Array.isArray(rawResult.summary) ? rawResult.summary : ["Analysis complete."];
        if (finalKpis.length < 3 && availableColumns.length > 0) {
            finalKpis.push({ id: uuidv4(), title: 'Total Rows', column: availableColumns[0], operation: 'count_distinct', format: 'number', trendDirection: 'higher-is-better' });
        }


        if (finalCharts.length === 0 && availableColumns.length >= 2) {
             finalCharts.push({
                 id: 'fallback_chart', type: 'bar', title: 'Data Overview', description: 'Automatic fallback chart.',
                 mapping: { x: availableColumns[0], y: availableColumns[1], aggregation: 'count' }
             });
        }

        return {
            summary: finalSummary,
            kpis: finalKpis,
            charts: finalCharts
        };

    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw new Error("Failed to analyze data. The AI model may be experiencing issues. Please try again.");
    }
};


export const generateAiReport = async (sample: DataRow[], analysis: AnalysisResult): Promise<string> => {
    const dataStr = JSON.stringify(sample.slice(0, 20)); // Use a small sample
    const analysisContext = JSON.stringify({
        summary: analysis.summary,
        kpis: analysis.kpis.map(k => k.title),
        charts: analysis.charts.map(c => c.title),
    });

    const prompt = `
    ROLE: You are a senior business consultant writing a report for a client.
    TASK: Analyze the provided data summary and raw data sample to generate a professional, insightful report in Markdown format. The tone should be formal, confident, and actionable.

    AVAILABLE DATA & ANALYSIS CONTEXT:
    ${analysisContext}

    RAW DATA SAMPLE (for context on values and columns):
    ${dataStr}

    REPORT REQUIREMENTS:
    Your entire response MUST be valid Markdown.
    1.  **Executive Summary:** Start with a heading "### Executive Summary". Write a concise, high-level paragraph summarizing the most critical insights and takeaways.
    2.  **Key Findings:** Create a heading "### Key Findings". Below it, list 2-4 of the most important findings as bullet points. Each bullet point MUST be bolded and followed by a short explanation of why it matters. For example:
        *   **West Region Outperforms All Others:** The West region shows significantly higher sales, suggesting a strong market fit or a successful regional strategy.
    3.  **Actionable Recommendations:** Create a heading "### Actionable Recommendations". Below it, list 2-3 concrete, strategic next steps the business should consider based on the findings. Frame them as clear recommendations. For example:
        *   **Recommendation: Double-down on marketing spend in the West region to capitalize on strong performance.**
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                temperature: 0.5,
            }
        });

        if (!response.text) {
            throw new Error("The AI consultant returned an empty report.");
        }

        return response.text;
    } catch (error) {
        console.error("AI Report Generation Error:", error);
        throw new Error("Failed to generate the AI report. The consultant might be on a coffee break. Please try again.");
    }
};


export const queryDataWithAI = async (sample: DataRow[], question: string): Promise<string> => {
    const dataStr = JSON.stringify(sample);
    let columnsInfo = "Unknown";
    if (sample.length > 0) {
        const firstRow = sample[0];
        columnsInfo = Object.keys(firstRow).join(', ');
    }

    const prompt = `
    You are an expert data analyst. A user has provided a data sample and a question. Your task is to answer the question based ONLY on the data provided.
    - Analyze the data to find the answer.
    - Provide a concise, clear, and direct answer.
    - The answer can be a single value, a short sentence, or a small bulleted list if necessary.
    - Do not provide code or explain how you got the answer. Just give the answer.
    - If the question cannot be answered from the data, state that clearly.

    DETECTED COLUMNS: ${columnsInfo}
    DATA SAMPLE (JSON):
    ${dataStr}

    USER QUESTION:
    "${question}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.1,
            }
        });
        
        if (!response.text) {
            return "Sorry, I couldn't process that request.";
        }
        
        return response.text;

    } catch (error) {
        console.error("Gemini Data Query Error:", error);
        throw new Error("Failed to query data with AI. The model may be experiencing issues.");
    }
};

export const generateFormulaFromNaturalLanguage = async (naturalLanguageQuery: string, columns: string[]): Promise<string> => {
    const prompt = `
    You are a formula generator. Your task is to convert a natural language description into a mathematical formula string.
    - The formula must use column names enclosed in square brackets, like [Column Name].
    - Use standard mathematical operators: +, -, *, /.
    - The output must be ONLY the formula string. Do not add any explanation, code fences, or other text.

    AVAILABLE COLUMNS:
    ${columns.join(', ')}

    USER'S REQUEST:
    "${naturalLanguageQuery}"

    FORMULA:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0,
                stopSequences: ['\n']
            }
        });
        
        let formula = response.text.trim();
        // Basic validation and cleanup
        if (formula.startsWith('`') && formula.endsWith('`')) {
            formula = formula.substring(1, formula.length - 1);
        }

        // Validate that the columns in the formula exist
        const columnsInFormula = formula.match(/\[(.*?)\]/g)?.map(c => c.slice(1, -1)) || [];
        for (const col of columnsInFormula) {
            if (!columns.includes(col)) {
                throw new Error(`The AI generated a formula with a column that does not exist: "${col}". Please rephrase your request.`);
            }
        }
        
        return formula;
    } catch (error) {
        console.error("Gemini Formula Generation Error:", error);
        throw new Error("The AI failed to generate a formula. Please try rephrasing your request or enter the formula manually.");
    }
};

export const generateChartInsight = async (chart: ChartConfig, data: DataRow[], promptType: 'summary' | 'insights'): Promise<string> => {
    const dataSample = JSON.stringify(data.slice(0, 30));
    const chartContext = JSON.stringify({
        title: chart.title,
        type: chart.type,
        description: chart.description,
        xAxis: chart.mapping.x,
        yAxis: chart.mapping.y,
        colorSeries: chart.mapping.color,
    });

    const goal = promptType === 'summary' 
        ? "Write a concise, one-paragraph summary of the key takeaway from this chart."
        : "List 2-3 bullet points of the most important insights revealed by this chart. Be specific and reference data points if possible.";

    const prompt = `
    ROLE: Expert Data Analyst.
    TASK: Analyze the provided chart configuration and data sample to generate an insight.

    CHART CONTEXT:
    ${chartContext}

    DATA SAMPLE (first 30 rows):
    ${dataSample}
    
    YOUR GOAL:
    ${goal}

    OUTPUT:
    Provide only the text for the summary or bullet points. Do not include any headers or introductory phrases like "Here is a summary...". For bullet points, use markdown like "* Insight one".
    `;

    try {
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

export const improveText = async (text: string, promptType: 'improve' | 'summarize'): Promise<string> => {
    const goal = promptType === 'improve'
        ? "Rewrite the following text to be more professional, clear, and impactful for a business report. Correct any grammar or spelling mistakes."
        : "Summarize the following text into a concise paragraph, capturing the main point.";

    const prompt = `
    ROLE: Expert Editor & Business Writer.
    TASK: ${goal}

    ORIGINAL TEXT:
    "${text}"

    REVISED TEXT:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.6 }
        });
        if (!response.text) throw new Error("AI returned an empty response.");
        return response.text.trim();
    } catch (error) {
        console.error("Gemini Text Improvement Error:", error);
        throw new Error("Failed to improve the text.");
    }
};
