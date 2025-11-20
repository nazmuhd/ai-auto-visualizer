
import { DataRow } from '../types.ts';

interface PromptSection {
    label: string;
    content: string;
}

export class PromptBuilder {
    private sections: PromptSection[] = [];
    private role: string = 'Expert Data Analyst';
    private task: string = '';
    // Conservative char-to-token ratio. English avg is ~4 chars/token.
    // Gemini Flash context is large (1M), but we want to be efficient and safe.
    // Setting a safe budget for the input data part to leave room for system instructions and output.
    private MAX_DATA_CHARS = 100000; 

    constructor(role?: string) {
        if (role) this.role = role;
    }

    setTask(task: string): PromptBuilder {
        this.task = task;
        return this;
    }

    addContext(label: string, content: string): PromptBuilder {
        this.sections.push({ label, content });
        return this;
    }

    /**
     * Intellegently adds data context.
     * If the JSON stringification of the data exceeds the budget,
     * it slices the array until it fits.
     */
    addData(label: string, data: DataRow[] | object): PromptBuilder {
        let json = JSON.stringify(data);
        
        if (json.length > this.MAX_DATA_CHARS && Array.isArray(data)) {
            console.warn(`Data context too large (${json.length} chars). Truncating to fit budget.`);
            
            // Estimate size per row
            const avgRowSize = json.length / data.length;
            const safeCount = Math.floor(this.MAX_DATA_CHARS / avgRowSize);
            
            // Take a sample: Head + Tail for better representation
            const half = Math.floor(safeCount / 2);
            const slicedData = [...data.slice(0, half), ...data.slice(data.length - half)];
            
            json = JSON.stringify(slicedData);
        }

        this.sections.push({ label, content: json });
        return this;
    }

    build(): string {
        const parts = [
            `ROLE: ${this.role}`,
            `TASK: ${this.task}`,
            ...this.sections.map(s => `${s.label.toUpperCase()}:\n${s.content}`)
        ];
        return parts.join('\n\n');
    }
}
