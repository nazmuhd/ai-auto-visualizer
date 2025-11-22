
import { ai } from "./client.ts";
import { DataRow } from '../../types.ts';
import { QUERY_DATA_PROMPT, FORMULA_GENERATION_PROMPT } from '../../lib/prompts.ts';

export const queryDataWithAI = async (sample: DataRow[], question: string): Promise<string> => {
    const dataStr = JSON.stringify(sample);
    let columnsInfo = "Unknown";
    if (sample.length > 0) {
        const firstRow = sample[0];
        columnsInfo = Object.keys(firstRow).join(', ');
    }

    const prompt = QUERY_DATA_PROMPT
        .replace('{{columnsInfo}}', columnsInfo)
        .replace('{{dataStr}}', dataStr)
        .replace('{{question}}', question);

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
    const prompt = FORMULA_GENERATION_PROMPT
        .replace('{{columns}}', columns.join(', '))
        .replace('{{query}}', naturalLanguageQuery);

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
