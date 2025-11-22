
import { ai } from "./client.ts";
import { DataRow } from '../../types.ts';

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
