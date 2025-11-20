
import { KpiConfig } from './analysis';
import { ChartConfig } from './charts';

export interface ContentBlock {
    id: string;
    type: 'text' | 'image' | 'video' | 'shape' | 'table';
    title?: string;
    content?: string; // For text content, image URL, video URL, or table JSON
    style?: 'title' | 'subtitle' | 'body' | 'h1' | 'h2' | 'quote' | 'bullet' | 'number' | 'todo' | 'note' | 'warning' | 'rect' | 'circle' | 'triangle' | 'arrow' | 'line' | 'filled'; 
    props?: Record<string, any>; // Flexible props for specific rendering (e.g. colors, border)
    // Advanced Shape/Theme Properties
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    rotation?: number;
    opacity?: number;
    // Placeholder Logic
    isPlaceholder?: boolean;
    placeholderType?: 'text' | 'chart' | 'image';
}

export interface ReportLayoutItem {
    i: string; // Unique identifier for the grid item (e.g., chart id, kpi id)
    x: number;
    y: number;
    w: number;
    h: number;
    isDraggable?: boolean;
    isResizable?: boolean;
}

export type LayoutId = 'BLANK' | 'TITLE_SLIDE' | 'TITLE_CONTENT' | 'TWO_CONTENT' | 'SECTION_HEADER';

export interface PresentationTheme {
    colors: {
        accent1: string;
        accent2: string;
        accent3: string;
        accent4: string;
        accent5: string;
        accent6: string;
        background: string;
        text: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
}

export interface Slide {
    id: string;
    layout: ReportLayoutItem[];
    layoutId?: LayoutId;
    sectionTitle?: string; // If present, starts a new section
    notes?: string; // Speaker notes
}

export interface Presentation {
    id: string;
    name: string;
    format: 'slides' | 'document';
    slides: Slide[];
    theme?: PresentationTheme;
    blocks?: ContentBlock[]; // Renamed from textBlocks to support all content types
    header?: ContentBlock;
    footer?: ContentBlock;
    themeSettings?: object; // Legacy
}

export interface LayoutInfo {
  id: string;
  name: string;
  rows: number[];
  totalCharts: number;
  description: string;
  usedBy: string;
}

export type PresentationFormat = 'slides' | 'document';

export interface ReportTemplate {
  id: string;
  format: PresentationFormat;
  name: string;
  company: string;
  range: string;
  description: string;
}