
import PptxGenJS from 'pptxgenjs';
import { Project, Presentation, Slide, ContentBlock, ReportLayoutItem, KpiConfig, ChartConfig, DataRow } from '../types.ts';

// 16:9 aspect ratio default
const SLIDE_WIDTH = 10; // inches
const SLIDE_HEIGHT = 5.625; // inches
const GRID_COLS = 12;
const GRID_ROWS = 12; // Approximate

const calculateKpiValue = (dataset: DataRow[], kpi: KpiConfig): number | null => {
    if (!dataset || dataset.length === 0) return null;
    let filteredData = dataset;
    if (kpi.primaryCategory && kpi.primaryCategoryValue) {
        filteredData = dataset.filter(r => String(r[kpi.primaryCategory!]) === kpi.primaryCategoryValue);
    }
    let baseValue = 0;
    if (kpi.operation === 'sum') baseValue = filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0);
    else if (kpi.operation === 'average') baseValue = filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0) / (filteredData.length || 1);
    else if (kpi.operation === 'count_distinct') baseValue = new Set(filteredData.map(row => row[kpi.column])).size;
    return baseValue * (kpi.multiplier || 1);
};

export const exportPresentationToPptx = async (project: Project, presentation: Presentation) => {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = presentation.name;
    
    // 1. Set Theme
    if (presentation.theme) {
        // Note: PptxGenJS support for themes is limited in the JS interface vs XML, 
        // but we can define the default color scheme via masters or background props.
        // Here we just use the colors directly in elements, but let's define a master to hold the background.
    }
    const theme = presentation.theme || {
        colors: {
            accent1: '#0284c7', accent2: '#0ea5e9', accent3: '#38bdf8', accent4: '#7dd3fc', accent5: '#bae6fd', accent6: '#e0f2fe',
            background: '#FFFFFF', text: '#333333'
        },
        fonts: { heading: 'Arial', body: 'Arial' }
    };

    // 2. Define Masters (Layouts)
    pptx.defineSlideMaster({
        title: 'TITLE_SLIDE',
        background: { color: theme.colors.background },
        objects: [
            { rect: { x: 0, y: 0, w: '100%', h: '15%', fill: { color: theme.colors.accent1 } } },
            { text: { text: 'CONFIDENTIAL', x: 9, y: 0.1, w: 1, h: 0.3, color: 'FFFFFF', fontSize: 10 } }
        ]
    });

    pptx.defineSlideMaster({
        title: 'MASTER_SLIDE',
        background: { color: theme.colors.background },
        objects: [
            { line: { x: 0.5, y: 0.8, w: 9, h: 0, line: { color: theme.colors.accent2, width: 2 } } }, // Title underline
             // Footer
            { text: { text: presentation.name, x: 0.5, y: 5.3, w: 4, h: 0.3, color: 'AAAAAA', fontSize: 9 } },
        ],
        slideNumber: { x: 9.2, y: 5.3, fontSize: 9, color: 'AAAAAA' }
    });

    // Helper to convert grid units to inches
    const getPos = (x: number, y: number, w: number, h: number) => {
        const colWidth = SLIDE_WIDTH / GRID_COLS;
        const rowHeight = SLIDE_HEIGHT / GRID_ROWS; 
        
        const marginX = 0.1;
        const marginY = 0.1;
        
        return {
            x: (x * colWidth) + marginX,
            y: (y * rowHeight) + marginY,
            w: (w * colWidth) - (marginX * 2),
            h: (h * rowHeight) - (marginY * 2)
        };
    };

    presentation.slides.forEach((slide, index) => {
        // 3. Sections
        if (slide.sectionTitle) {
            pptx.addSection({ title: slide.sectionTitle });
        }

        // 4. Add Slide with Master
        const masterName = slide.layoutId === 'TITLE_SLIDE' ? 'TITLE_SLIDE' : 'MASTER_SLIDE';
        const pptxSlide = pptx.addSlide({ masterName });
        
        // 5. Speaker Notes
        if (slide.notes) {
            pptxSlide.addNotes(slide.notes);
        }

        slide.layout.forEach(item => {
            const pos = getPos(item.x, item.y, item.w, item.h);
            
            const kpi = project.analysis?.kpis?.find(k => k.id === item.i);
            const chart = project.analysis?.charts?.find(c => c.id === item.i);
            const block = (presentation.blocks || []).find(t => t.id === item.i);

            if (block) {
                // Handle Styles
                const fillColor = block.fill ? { color: block.fill.replace('#', '') } : undefined;
                // const stroke = block.stroke ? { color: block.stroke.replace('#', ''), width: block.strokeWidth || 1 } : undefined;
                const rotation = block.rotation || 0;

                if (block.type === 'text') {
                    let fontSize = 14;
                    let bold = false;
                    let color = theme.colors.text.replace('#', '');
                    
                    if (block.style === 'title') { fontSize = 32; bold = true; color = theme.colors.accent1.replace('#', ''); }
                    if (block.style === 'h1') { fontSize = 24; bold = true; }
                    if (block.style === 'h2') { fontSize = 18; bold = true; color = '666666'; }
                    if (block.style === 'note' || block.style === 'warning') { 
                        pptxSlide.addShape(pptx.ShapeType.rect, { 
                            x: pos.x, y: pos.y, w: pos.w, h: pos.h, 
                            fill: { color: block.style === 'warning' ? 'FFF7ED' : 'EFF6FF' } 
                        });
                    }

                    pptxSlide.addText(block.content || '', {
                        x: pos.x, y: pos.y, w: pos.w, h: pos.h,
                        fontSize, bold, color,
                        valign: 'top',
                        rotate: rotation
                    });
                } else if (block.type === 'image') {
                     if (block.content && block.content.startsWith('http')) {
                         pptxSlide.addImage({ path: block.content, x: pos.x, y: pos.y, w: pos.w, h: pos.h, rotate: rotation });
                     } else {
                         pptxSlide.addText("Image Placeholder", { x: pos.x, y: pos.y, w: pos.w, h: pos.h, align: 'center', fill: { color: 'EEEEEE' } });
                     }
                } else if (block.type === 'shape') {
                     let shapeType = pptx.ShapeType.rect;
                     if (block.style === 'circle') shapeType = pptx.ShapeType.ellipse;
                     if (block.style === 'triangle') shapeType = pptx.ShapeType.triangle;
                     if (block.style === 'arrow') shapeType = pptx.ShapeType.rightArrow;

                     pptxSlide.addShape(shapeType, { 
                         x: pos.x, y: pos.y, w: pos.w, h: pos.h, 
                         fill: fillColor || { color: theme.colors.accent2.replace('#', '') },
                         rotate: rotation 
                    });
                }
            }
            else if (kpi) {
                const val = calculateKpiValue(project.dataSource.data, kpi);
                const formattedVal = new Intl.NumberFormat('en', { maximumFractionDigits: 1, notation: 'compact' }).format(val ?? 0);
                
                pptxSlide.addShape(pptx.ShapeType.rect, {
                    x: pos.x, y: pos.y, w: pos.w, h: pos.h,
                    fill: { color: 'FFFFFF' },
                    line: { color: 'E2E8F0', width: 1 }
                });
                
                pptxSlide.addText(kpi.title, {
                    x: pos.x + 0.1, y: pos.y + 0.1, w: pos.w - 0.2, h: pos.h * 0.3,
                    fontSize: 11, color: '64748B'
                });
                
                pptxSlide.addText(formattedVal, {
                    x: pos.x + 0.1, y: pos.y + (pos.h * 0.4), w: pos.w - 0.2, h: pos.h * 0.5,
                    fontSize: 28, bold: true, color: '0F172A'
                });
            }
            else if (chart) {
                pptxSlide.addShape(pptx.ShapeType.rect, {
                    x: pos.x, y: pos.y, w: pos.w, h: pos.h,
                    fill: { color: 'F8FAFC' },
                    line: { color: 'CBD5E1', width: 1, dashType: 'dash' }
                });
                
                pptxSlide.addText(`Chart: ${chart.title}`, {
                    x: pos.x, y: pos.y, w: pos.w, h: pos.h,
                    align: 'center', fontSize: 12, color: '64748B'
                });
                
                pptxSlide.addText(`(Charts are rendered as placeholders in this preview)`, {
                    x: pos.x, y: pos.y + (pos.h/2), w: pos.w, h: 0.5,
                    align: 'center', fontSize: 9, color: '94A3B8', italic: true
                });
            }
        });
    });

    await pptx.writeFile({ fileName: `${presentation.name.replace(/[^a-z0-9]/gi, '_')}.pptx` });
};
