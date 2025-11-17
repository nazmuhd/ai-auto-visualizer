import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DataRow, ChartConfig, KpiConfig, TextBlock, ReportTemplate, Presentation, Slide, ReportLayoutItem } from '../types.ts';
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

const presentationSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "A concise, professional name for the presentation." },
        slides: {
            type: Type.ARRAY,
            description: "An array of slides. The first slide should be a title slide. Subsequent slides should present KPIs and charts logically.",
            items: {
                type: Type.OBJECT,
                properties: {
                    layout: {
                        type: Type.ARRAY,
                        description: "Array of grid layout items for this slide.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                i: { type: Type.STRING, description: "The ID of the item (chart, kpi, or text block ID)." },
                                x: { type: Type.INTEGER },
                                y: { type: Type.INTEGER },
                                w: { type: Type.INTEGER },
                                h: { type: Type.INTEGER },
                            },
                            required: ['i', 'x', 'y', 'w', 'h'],
                        }
                    }
                },
                required: ['layout']
            }
        },
        textBlocks: {
            type: Type.ARRAY,
            description: "Any text blocks needed for the presentation, like titles or summaries.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique ID for the text block, prefixed with 'text_'." },
                    type: { type: Type.STRING, enum: ['text'] },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    style: { type: Type.STRING, enum: ['title', 'subtitle', 'body'] },
                },
                required: ['id', 'type', 'title', 'content', 'style'],
            }
        }
    },
    required: ['name', 'slides', 'textBlocks']
};

const slideLayoutSchema = {
    type: Type.OBJECT,
    properties: {
        layout: {
            type: Type.ARRAY,
            description: "Array of grid layout items for this slide.",
            items: {
                type: Type.OBJECT,
                properties: {
                    i: { type: Type.STRING, description: "The ID of the item (chart, kpi, or text block ID)." },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    w: { type: Type.INTEGER },
                    h: { type: Type.INTEGER },
                },
                required: ['i', 'x', 'y', 'w', 'h'],
            }
        },
        newTextBlocks: {
            type: Type.ARRAY,
            description: "Any NEW text blocks created for this slide. Do not include existing ones.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique ID for the text block, prefixed with 'text_'." },
                    type: { type: Type.STRING, enum: ['text'] },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    style: { type: Type.STRING, enum: ['title', 'subtitle', 'body'] },
                },
                required: ['id', 'type', 'title', 'content', 'style'],
            }
        }
    },
    required: ['layout', 'newTextBlocks']
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

export const improveText = async (text: string, promptType: 'improve' | 'summarize' | 'check_grammar'): Promise<string> => {
    const goal = promptType === 'improve'
        ? "Rewrite the following text to be more professional, clear, and impactful for a business report. Correct any grammar or spelling mistakes."
        : promptType === 'summarize'
        ? "Summarize the following text into a concise paragraph, capturing the main point."
        : "Proofread the following text. Correct any grammar or spelling mistakes and return only the corrected text. Do not change the meaning or tone unless it's grammatically necessary.";

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

export const generateInitialPresentation = async (analysis: AnalysisResult, template: ReportTemplate, projectName: string): Promise<Presentation> => {
    const analysisContext = JSON.stringify({
        summary: analysis.summary,
        availableKpis: analysis.kpis.map(k => ({ id: k.id, title: k.title })),
        availableCharts: analysis.charts.map(c => ({ id: c.id, title: c.title })),
    });

    const isSlides = template.format === 'slides';
    const slideInstructions = isSlides
        ? `
        - SLIDE 1 (Title Slide): Create a title slide with a main title text block for "${projectName}" and a subtitle text block with a short, insightful summary.
        - SLIDE 2 (KPI Overview): Create a slide with the 4-6 most important KPIs. Arrange them neatly in a row or grid.
        - SUBSEQUENT SLIDES: Dedicate one slide for each of the top 2-3 most important charts. On each slide, place the chart and a small text block with a brief insight about that chart. Arrange at most 2 charts per slide for clarity.`
        : `
        - PAGE 1 (Title & Summary): Create a title text block for "${projectName}", a subtitle with the date, and a main body text block for the executive summary. Below that, add the top 4 KPIs.
        - SUBSEQUENT PAGES: Add up to 4 charts, placing 1 or 2 charts per page. For each chart, add a small text block with an insight.
        `;
    
    const prompt = `
    ROLE: Expert Presentation Designer.
    TASK: Create a professional, multi-page presentation structure in JSON format based on the provided analysis.

    ANALYSIS CONTEXT (Available items and their IDs):
    ${analysisContext}

    PRESENTATION REQUIREMENTS:
    - Format: ${template.name} (${template.format}). This is a ${isSlides ? '16:9 slide deck' : 'A4 document'}.
    - Grid System: The layout is a 12-column grid.
    - Text Blocks: Any text you generate (titles, insights) must be created as a TextBlock object with a unique ID (e.g., 'text_uuid'). The slide layout must then reference this ID.
    - Content Placement:
        ${slideInstructions}
    
    OUTPUT:
    - Generate a JSON object that strictly adheres to the provided schema.
    - Ensure all 'i' values in layouts correspond to an ID from the available context or a newly created text block ID.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: presentationSchema,
                temperature: 0.3,
            }
        });

        if (!response.text) throw new Error("Gemini returned an empty presentation structure.");
        const rawResult = JSON.parse(response.text) as any;

        const presentation: Presentation = {
            id: `pres_${uuidv4()}`,
            name: rawResult.name || projectName,
            format: template.format,
            slides: (rawResult.slides || []).map((slide: any) => ({
                id: `slide_${uuidv4()}`,
                layout: slide.layout || [],
            })),
            textBlocks: rawResult.textBlocks || [],
        };
        
        if (template.format === 'document') {
            const headerBlock: TextBlock = { id: `header_${uuidv4()}`, type: 'text', title: 'Report Header', content: `${projectName} - ${new Date().toLocaleDateString()}` };
            const footerBlock: TextBlock = { id: `footer_${uuidv4()}`, type: 'text', title: 'Report Footer', content: 'Page %page% of %total%' };
            presentation.header = headerBlock;
            presentation.footer = footerBlock;
            if (!presentation.textBlocks) presentation.textBlocks = [];
            presentation.textBlocks.push(headerBlock, footerBlock);
        }

        return presentation;

    } catch (error) {
        console.error("Gemini Presentation Generation Error:", error);
        throw new Error("Failed to generate the AI presentation. The model may be having trouble with the request. Please try again.");
    }
};

export const addSlideWithAI = async (
    prompt: string,
    analysis: AnalysisResult,
    projectName: string,
    isSlides: boolean
): Promise<{ newSlide: Slide; newTextBlocks: TextBlock[] }> => {
    const analysisContext = JSON.stringify({
        availableKpis: analysis.kpis.map(k => ({ id: k.id, title: k.title })),
        availableCharts: analysis.charts.map(c => ({ id: c.id, title: c.title })),
    });

    const aiPrompt = `
    ROLE: Expert Presentation Designer.
    TASK: Create a SINGLE new slide structure in JSON format based on a user's request.

    CONTEXT:
    - Project Name: "${projectName}"
    - Presentation Format: ${isSlides ? '16:9 slide deck' : 'A4 document'}.
    - Grid System: The layout is a 12-column grid.
    - Available Items: ${analysisContext}

    USER'S REQUEST for the new slide:
    "${prompt}"

    REQUIREMENTS:
    - Text Blocks: Any text you generate (titles, insights) must be created as a NEW TextBlock object with a unique ID (e.g., 'text_uuid'). The slide layout must then reference this ID.
    - Content Placement: Intelligently arrange the requested items on the slide. Use appropriate text blocks to fulfill the request.
    
    OUTPUT:
    - Generate a JSON object that strictly adheres to the provided schema, containing the 'layout' for the new slide and a list of any 'newTextBlocks' you created.
    - Ensure all 'i' values in the layout correspond to an ID from the available context or a newly created text block ID.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: aiPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: slideLayoutSchema,
                temperature: 0.3,
            }
        });

        if (!response.text) throw new Error("AI returned an empty slide structure.");
        const rawResult = JSON.parse(response.text) as any;

        const newSlide: Slide = {
            id: `slide_${uuidv4()}`,
            layout: rawResult.layout || [],
        };

        return { newSlide, newTextBlocks: rawResult.newTextBlocks || [] };

    } catch (error) {
        console.error("Gemini Add Slide Error:", error);
        throw new Error("Failed to generate the AI slide. The model may be having trouble with the request.");
    }
};

export const editSlideWithAI = async (
    currentSlide: Slide,
    allTextBlocks: TextBlock[],
    analysis: AnalysisResult,
    prompt: string,
    isSlides: boolean
): Promise<{ updatedLayout: ReportLayoutItem[]; newTextBlocks: TextBlock[] }> => {
    
    const itemsOnSlide = currentSlide.layout.map(item => {
        const chart = analysis.charts.find(c => c.id === item.i);
        if (chart) return `Chart: "${chart.title}" (ID: ${item.i})`;
        const kpi = analysis.kpis.find(k => k.id === item.i);
        if (kpi) return `KPI: "${kpi.title}" (ID: ${item.i})`;
        const text = allTextBlocks.find(t => t.id === item.i);
        if (text) return `Text: "${text.content.substring(0, 50)}..." (ID: ${item.i})`;
        return `Unknown item (ID: ${item.i})`;
    }).join('\n');

    const analysisContext = JSON.stringify({
        availableKpis: analysis.kpis.map(k => ({ id: k.id, title: k.title })),
        availableCharts: analysis.charts.map(c => ({ id: c.id, title: c.title })),
    });

    const aiPrompt = `
    ROLE: Expert Presentation Designer.
    TASK: Revise the layout of a SINGLE slide based on a user's request. You can add, remove, or rearrange items.

    CONTEXT:
    - Presentation Format: ${isSlides ? '16:9 slide deck' : 'A4 document'}.
    - Grid System: A 12-column grid.
    - Items currently on the slide:
    ${itemsOnSlide || 'This slide is currently empty.'}
    - Full list of available items for this project:
    ${analysisContext}

    USER'S EDIT REQUEST:
    "${prompt}"

    REQUIREMENTS:
    - You MUST return a complete new layout for the slide.
    - If you add new text content, create it as a NEW TextBlock object in the 'newTextBlocks' array. Use unique IDs (e.g., 'text_uuid').
    - You can use any available items from the project context, not just the ones already on the slide.
    - You can remove existing items by simply omitting them from the new layout.
    
    OUTPUT:
    - Generate a JSON object that strictly adheres to the provided schema, containing the new 'layout' and any 'newTextBlocks' you created.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: aiPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: slideLayoutSchema,
                temperature: 0.4,
            }
        });

        if (!response.text) throw new Error("AI returned an empty response for the slide edit.");
        const rawResult = JSON.parse(response.text) as any;

        return {
            updatedLayout: rawResult.layout || [],
            newTextBlocks: rawResult.newTextBlocks || [],
        };
    } catch (error) {
        console.error("Gemini Edit Slide Error:", error);
        throw new Error("Failed to edit the slide with AI. Please try rephrasing your request.");
    }
};