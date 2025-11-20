
import { ai } from "./client.ts";
import { DataRow } from '../../types.ts';
import { PromptBuilder } from '../../lib/prompt-builder.ts';

export const streamDataQuery = async (
    sample: DataRow[], 
    question: string, 
    onChunk: (text: string) => void
): Promise<void> => {
    let columnsInfo = "Unknown";
    if (sample.length > 0) {
        const firstRow = sample[0];
        columnsInfo = Object.keys(firstRow).join(', ');
    }

    const prompt = new PromptBuilder('Expert Data Analyst')
        .setTask('Answer the user question based ONLY on the provided data sample.')
        .addContext('DETECTED COLUMNS', columnsInfo)
        .addData('DATA SAMPLE', sample)
        .addContext('USER QUESTION', question)
        .addContext('GUIDELINES', `
            - Analyze the data to find the answer.
            - Provide a concise, clear, and direct answer.
            - The answer can be a single value, a short sentence, or a small bulleted list if necessary.
            - Do not provide code or explain how you got the answer. Just give the answer.
            - If the question cannot be answered from the data, state that clearly.
        `)
        .build();

    try {
        const result = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.1,
            }
        });
        
        for await (const chunk of result) {
            const text = chunk.text;
            if (text) {
                onChunk(text);
            }
        }

    } catch (error) {
        console.error("Gemini Data Query Error:", error);
        throw new Error("Failed to query data with AI. The model may be experiencing issues.");
    }
};

export const generateFormulaFromNaturalLanguage = async (naturalLanguageQuery: string, columns: string[]): Promise<string> => {
    const prompt = new PromptBuilder('Formula Generator')
        .setTask('Convert a natural language description into a mathematical formula string.')
        .addContext('AVAILABLE COLUMNS', columns.join(', '))
        .addContext('USER REQUEST', naturalLanguageQuery)
        .addContext('RULES', `
            - The formula must use column names enclosed in square brackets, like [Column Name].
            - Use standard mathematical operators: +, -, *, /.
            - The output must be ONLY the formula string. Do not add any explanation, code fences, or other text.
        `)
        .build();

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
