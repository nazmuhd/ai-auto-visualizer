
import { z } from 'zod';

// --- Analysis Schemas ---

export const KpiSchema = z.object({
    title: z.string(),
    column: z.string(),
    operation: z.enum(['sum', 'average', 'count_distinct']),
    format: z.enum(['number', 'currency', 'percent']),
    trendDirection: z.enum(['higher-is-better', 'lower-is-better']),
    primaryCategory: z.string().optional().nullable(),
    primaryCategoryValue: z.string().optional().nullable(),
});

export const ChartMappingSchema = z.object({
    x: z.string(),
    y: z.string(),
    z: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    aggregation: z.enum(['sum', 'average', 'count', 'none']).optional().nullable(),
});

export const ChartSchema = z.object({
    templateId: z.string(),
    titleOverride: z.string().optional().nullable(),
    insightDescription: z.string().optional().nullable(),
    mapping: ChartMappingSchema,
});

export const AnalysisResultSchema = z.object({
    summary: z.array(z.string()),
    kpis: z.array(KpiSchema),
    recommendedCharts: z.array(ChartSchema),
});

// --- Presentation Schemas ---

export const ReportLayoutItemSchema = z.object({
    i: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
});

export const ContentBlockSchema = z.object({
    id: z.string(),
    type: z.enum(['text', 'image', 'video', 'shape', 'table']).or(z.string()),
    title: z.string().optional(),
    content: z.string().optional(),
    style: z.string().optional(),
});

export const SlideSchema = z.object({
    layout: z.array(ReportLayoutItemSchema),
});

export const PresentationSchema = z.object({
    name: z.string(),
    slides: z.array(SlideSchema),
    blocks: z.array(ContentBlockSchema).optional(),
});

export const SlideLayoutSchema = z.object({
    layout: z.array(ReportLayoutItemSchema),
    newBlocks: z.array(ContentBlockSchema),
});
