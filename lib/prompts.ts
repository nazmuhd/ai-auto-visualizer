
// Centralized Prompt Library for Prompt Engineering abstraction

export const ANALYSIS_PROMPT = `
ROLE: Expert Business Analyst.
TASK: Analyze the provided data sample to generate a dashboard configuration.

INPUT DATA SAMPLE (JSON):
{{dataStr}}

DETECTED COLUMNS:
{{columnsInfo}}

REQUIREMENTS:
1. SUMMARY: Provide 3-4 clear, actionable bullet points summarizing key trends or outliers.
2. KPIs: Identify between 5 and 10 KPIs. For each KPI:
    - Define HOW to calculate it (e.g., SUM of 'Revenue').
    - Determine trend direction: Is a higher value better or worse? (e.g., higher revenue is good, higher costs are bad).
    - If a KPI represents a specific segment (e.g., "Sales - North America"), identify its category column (e.g., 'Region') and its value (e.g., 'North America').
3. CHARTS: Map the data to a diverse set of between 5 and 8 chart templates that reveal different aspects of the data. Choose the most insightful charts.

AVAILABLE CHART TEMPLATES:
- tmpl_bar_comparison (Good for: Ranking)
- tmpl_horizontal_bar (Good for: Ranking with long names)
- tmpl_line_trend (Good for: Time series)
- tmpl_area_volume (Good for: Cumulative totals over time)
- tmpl_area_stacked (Good for: Stacked trends)
- tmpl_pie_distribution (Good for: Part-to-whole, <10 categories)
- tmpl_donut (Good for: Part-to-whole modern look)
- tmpl_scatter_correlation (Good for: Numeric relationships)
- tmpl_stacked_bar (Good for: Composition across categories. Requires 'color' mapping.)
- tmpl_combo_line_bar (Good for: Comparing two different Y metrics. The line and bar must share the same X-axis.)
- tmpl_bubble_plot (Good for: 3 numeric variables. Requires 'z' mapping for bubble size.)
`;

export const CHART_INSIGHT_PROMPT = `
ROLE: Expert Data Analyst.
TASK: Analyze the provided chart configuration and data sample to generate an insight.

CHART CONTEXT:
{{chartContext}}

DATA SAMPLE (first 30 rows):
{{dataSample}}

YOUR GOAL:
{{goal}}

OUTPUT:
Provide only the text for the summary or bullet points. Do not include any headers or introductory phrases like "Here is a summary...". For bullet points, use markdown like "* Insight one".
`;

export const PRESENTATION_GENERATION_PROMPT = `
ROLE: Expert Presentation Designer.
TASK: Create a professional, multi-page presentation structure in JSON format based on the provided analysis.

ANALYSIS CONTEXT (Available items and their IDs):
{{analysisContext}}

PRESENTATION REQUIREMENTS:
- Format: {{templateName}} ({{templateFormat}}). This is a {{formatType}}.
- Grid System: The layout is a 12-column grid.
- Blocks: Any text you generate (titles, insights) must be created as a Block object with a unique ID (e.g., 'text_uuid'). The slide layout must then reference this ID.
- Content Placement:
    {{slideInstructions}}

OUTPUT:
- Generate a JSON object that strictly adheres to the provided schema.
- Ensure all 'i' values in layouts correspond to an ID from the available context or a newly created text block ID.
`;

export const QUERY_DATA_PROMPT = `
You are an expert data analyst. A user has provided a data sample and a question. Your task is to answer the question based ONLY on the data provided.
- Analyze the data to find the answer.
- Provide a concise, clear, and direct answer.
- The answer can be a single value, a short sentence, or a small bulleted list if necessary.
- Do not provide code or explain how you got the answer. Just give the answer.
- If the question cannot be answered from the data, state that clearly.

DETECTED COLUMNS: {{columnsInfo}}
DATA SAMPLE (JSON):
{{dataStr}}

USER QUESTION:
"{{question}}"
`;

export const FORMULA_GENERATION_PROMPT = `
You are a formula generator. Your task is to convert a natural language description into a mathematical formula string.
- The formula must use column names enclosed in square brackets, like [Column Name].
- Use standard mathematical operators: +, -, *, /.
- The output must be ONLY the formula string. Do not add any explanation, code fences, or other text.

AVAILABLE COLUMNS:
{{columns}}

USER'S REQUEST:
"{{query}}"

FORMULA:
`;
