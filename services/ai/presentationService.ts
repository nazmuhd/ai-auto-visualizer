
import { ai } from "./client.ts";
import { Type } from "@google/genai";
import { AnalysisResult, ReportTemplate, Presentation, Slide, ContentBlock, ReportLayoutItem } from '../../types.ts';
import { PromptBuilder } from '../../lib/prompt-builder.ts';
import { generateStructuredContent } from './resilience.ts';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// --- GEMINI SCHEMAS (for API) ---
const presentationGeminiSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        slides: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    layout: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                i: { type: Type.STRING },
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
        blocks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['text'] },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    style: { type: Type.STRING, enum: ['title', 'subtitle', 'body', 'h1', 'h2'] },
                },
                required: ['id', 'type', 'title', 'content', 'style'],
            }
        }
    },
    required: ['name', 'slides', 'blocks']
};

const slideLayoutGeminiSchema = {
    type: Type.OBJECT,
    properties: {
        layout: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    i: { type: Type.STRING },
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    w: { type: Type.INTEGER },
                    h: { type: Type.INTEGER },
                },
                required: ['i', 'x', 'y', 'w', 'h'],
            }
        },
        newBlocks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['text'] },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    style: { type: Type.STRING, enum: ['title', 'subtitle', 'body'] },
                },
                required: ['id', 'type', 'title', 'content', 'style'],
            }
        }
    },
    required: ['layout', 'newBlocks']
};

// --- ZOD SCHEMAS (for Validation) ---
const zLayoutItem = z.object({
    i: z.string(),
    x: z.number().int(),
    y: z.number().int(),
    w: z.number().int(),
    h: z.number().int(),
});

const zBlock = z.object({
    id: z.string(),
    type: z.literal('text'), // AI mostly generates text blocks
    title: z.string().optional(),
    content: z.string(),
    style: z.enum(['title', 'subtitle', 'body', 'h1', 'h2', 'quote', 'bullet', 'number', 'todo', 'note', 'warning']).optional().or(z.string()),
});

const zPresentationResult = z.object({
    name: z.string(),
    slides: z.array(z.object({
        layout: z.array(zLayoutItem)
    })),
    blocks: z.array(zBlock)
});

const zSlideResult = z.object({
    layout: z.array(zLayoutItem),
    newBlocks: z.array(zBlock)
});

type PresentationAIResponse = z.infer<typeof zPresentationResult>;
type SlideAIResponse = z.infer<typeof zSlideResult>;

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
    
    const prompt = new PromptBuilder('Expert Presentation Designer')
        .setTask('Create a professional, multi-page presentation structure in JSON format based on the provided analysis.')
        .addContext('ANALYSIS CONTEXT', analysisContext)
        .addContext('PRESENTATION REQUIREMENTS', `
            - Format: ${template.name} (${template.format}). This is a ${isSlides ? '16:9 slide deck' : 'A4 document'}.
            - Grid System: The layout is a 12-column grid.
            - Blocks: Any text you generate (titles, insights) must be created as a Block object with a unique ID (e.g., 'text_uuid'). The slide layout must then reference this ID.
            - Content Placement: ${slideInstructions}
        `)
        .addContext('OUTPUT', `
            - Generate a JSON object that strictly adheres to the provided schema.
            - Ensure all 'i' values in layouts correspond to an ID from the available context or a newly created text block ID.
        `)
        .build();

    try {
        const rawResult = await generateStructuredContent<PresentationAIResponse>(
            'gemini-2.5-pro',
            prompt,
            presentationGeminiSchema,
            zPresentationResult
        );

        const presentation: Presentation = {
            id: `pres_${uuidv4()}`,
            name: rawResult.name || projectName,
            format: template.format,
            slides: (rawResult.slides || []).map((slide: any) => ({
                id: `slide_${uuidv4()}`,
                layout: slide.layout || [],
            })),
            blocks: (rawResult.blocks || []).map((b: any) => ({
                ...b,
                type: 'text', // Ensure type is set
                style: b.style as any 
            })),
        };
        
        if (template.format === 'document') {
            const headerBlock: ContentBlock = { id: `header_${uuidv4()}`, type: 'text', title: 'Report Header', content: `${projectName} - ${new Date().toLocaleDateString()}` };
            const footerBlock: ContentBlock = { id: `footer_${uuidv4()}`, type: 'text', title: 'Report Footer', content: 'Page %page% of %total%' };
            presentation.header = headerBlock;
            presentation.footer = footerBlock;
            if (!presentation.blocks) presentation.blocks = [];
            presentation.blocks.push(headerBlock, footerBlock);
        }

        return presentation;

    } catch (error: any) {
        console.error("Gemini Presentation Generation Error:", error);
        throw new Error(error.message || "Failed to generate the AI presentation.");
    }
};

export const improveText = async (text: string, promptType: 'improve' | 'summarize' | 'check_grammar'): Promise<string> => {
    const goal = promptType === 'improve'
        ? "Rewrite the following text to be more professional, clear, and impactful for a business report. Correct any grammar or spelling mistakes."
        : promptType === 'summarize'
        ? "Summarize the following text into a concise paragraph, capturing the main point."
        : "Proofread the following text. Correct any grammar or spelling mistakes and return only the corrected text. Do not change the meaning or tone unless it's grammatically necessary.";

    const prompt = new PromptBuilder('Expert Editor & Business Writer')
        .setTask(goal)
        .addContext('ORIGINAL TEXT', text)
        .build();

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

export const addSlideWithAI = async (
    promptUser: string,
    analysis: AnalysisResult,
    projectName: string,
    isSlides: boolean
): Promise<{ newSlide: Slide; newBlocks: ContentBlock[] }> => {
    const analysisContext = JSON.stringify({
        availableKpis: analysis.kpis.map(k => ({ id: k.id, title: k.title })),
        availableCharts: analysis.charts.map(c => ({ id: c.id, title: c.title })),
    });

    const aiPrompt = new PromptBuilder('Expert Presentation Designer')
        .setTask('Create a SINGLE new slide structure in JSON format based on a user\'s request.')
        .addContext('CONTEXT', `
            - Project Name: "${projectName}"
            - Presentation Format: ${isSlides ? '16:9 slide deck' : 'A4 document'}.
            - Grid System: The layout is a 12-column grid.
            - Available Items: ${analysisContext}
        `)
        .addContext('USER REQUEST', promptUser)
        .addContext('REQUIREMENTS', `
            - Blocks: Any text you generate (titles, insights) must be created as a NEW Block object with a unique ID (e.g., 'text_uuid'). The slide layout must then reference this ID.
            - Content Placement: Intelligently arrange the requested items on the slide. Use appropriate text blocks to fulfill the request.
        `)
        .build();

    try {
        const rawResult = await generateStructuredContent<SlideAIResponse>(
            'gemini-2.5-flash',
            aiPrompt,
            slideLayoutGeminiSchema,
            zSlideResult
        );

        const newSlide: Slide = {
            id: `slide_${uuidv4()}`,
            layout: rawResult.layout || [],
        };

        const safeBlocks: ContentBlock[] = (rawResult.newBlocks || []).map(b => ({
            ...b, 
            type: 'text', 
            style: b.style as any 
        }));

        return { newSlide, newBlocks: safeBlocks };

    } catch (error: any) {
        console.error("Gemini Add Slide Error:", error);
        throw new Error(error.message || "Failed to generate the AI slide.");
    }
};

export const editSlideWithAI = async (
    currentSlide: Slide,
    allBlocks: ContentBlock[],
    analysis: AnalysisResult,
    promptUser: string,
    isSlides: boolean
): Promise<{ updatedLayout: ReportLayoutItem[]; newBlocks: ContentBlock[] }> => {
    
    const itemsOnSlide = currentSlide.layout.map(item => {
        const chart = analysis.charts.find(c => c.id === item.i);
        if (chart) return `Chart: "${chart.title}" (ID: ${item.i})`;
        const kpi = analysis.kpis.find(k => k.id === item.i);
        if (kpi) return `KPI: "${kpi.title}" (ID: ${item.i})`;
        const text = allBlocks.find(t => t.id === item.i);
        if (text) return `Text: "${text.content?.substring(0, 50)}..." (ID: ${item.i})`;
        return `Unknown item (ID: ${item.i})`;
    }).join('\n');

    const analysisContext = JSON.stringify({
        availableKpis: analysis.kpis.map(k => ({ id: k.id, title: k.title })),
        availableCharts: analysis.charts.map(c => ({ id: c.id, title: c.title })),
    });

    const aiPrompt = new PromptBuilder('Expert Presentation Designer')
        .setTask('Revise the layout of a SINGLE slide based on a user\'s request. You can add, remove, or rearrange items.')
        .addContext('CONTEXT', `
            - Presentation Format: ${isSlides ? '16:9 slide deck' : 'A4 document'}.
            - Grid System: A 12-column grid.
            - Items currently on the slide: ${itemsOnSlide || 'This slide is currently empty.'}
            - Full list of available items for this project: ${analysisContext}
        `)
        .addContext('USER REQUEST', promptUser)
        .addContext('REQUIREMENTS', `
            - You MUST return a complete new layout for the slide.
            - If you add new text content, create it as a NEW Block object in the 'newBlocks' array. Use unique IDs (e.g., 'text_uuid').
            - You can use any available items from the project context, not just the ones already on the slide.
            - You can remove existing items by simply omitting them from the new layout.
        `)
        .build();

    try {
        const rawResult = await generateStructuredContent<SlideAIResponse>(
            'gemini-2.5-flash',
            aiPrompt,
            slideLayoutGeminiSchema,
            zSlideResult
        );

        const safeBlocks: ContentBlock[] = (rawResult.newBlocks || []).map(b => ({
            ...b, 
            type: 'text', 
            style: b.style as any 
        }));

        return {
            updatedLayout: rawResult.layout || [],
            newBlocks: safeBlocks,
        };
    } catch (error: any) {
        console.error("Gemini Edit Slide Error:", error);
        throw new Error(error.message || "Failed to edit the slide with AI.");
    }
};
