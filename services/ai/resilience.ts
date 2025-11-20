
import { ai } from "./client.ts";
import { z } from "zod";

/**
 * a wrapper for Gemini that enforces a Zod schema on the output.
 * If validation fails, it automatically retries with a correction prompt.
 */
export async function generateStructuredContent<T>(
    model: string,
    prompt: string,
    geminiSchema: any,
    zodSchema: z.ZodType<T>,
    maxRetries = 2
): Promise<T> {
    let currentPrompt = prompt;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Attempt to generate content
            // On retries, lower temperature to zero to force determinism
            const temperature = attempt === 0 ? 0.2 : 0;
            
            const response = await ai.models.generateContent({
                model: model,
                contents: currentPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: geminiSchema,
                    temperature: temperature,
                }
            });

            const text = response.text;
            if (!text) throw new Error("Empty response received from AI model.");

            // 1. Parse JSON
            let parsed: any;
            try {
                parsed = JSON.parse(text);
            } catch (e) {
                throw new Error("AI returned malformed JSON.");
            }

            // 2. Validate Structure with Zod
            const validation = zodSchema.safeParse(parsed);
            
            if (validation.success) {
                return validation.data;
            } else {
                // Format Zod errors into a readable string for the AI
                const errorDetails = validation.error.errors
                    .map(e => `- Path: '${e.path.join('.')}', Error: ${e.message}`)
                    .join('\n');
                throw new Error(`Schema validation failed:\n${filterSchemaErrorMessage(errorDetails)}`);
            }

        } catch (error: any) {
            console.warn(`[AI Resilience] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error.message);
            lastError = error;

            if (attempt < maxRetries) {
                // 3. Construct Repair Prompt for next iteration
                // We append the error to the context so Gemini knows what to fix.
                currentPrompt += `\n\nSYSTEM_ALERT: The previous response was invalid based on the required schema. \nERROR DETAILS:\n${error.message}\n\nTASK: Regenerate the JSON response, strictly fixing the errors listed above. Do not include any markdown formatting, just the raw JSON.`;
            }
        }
    }

    throw new Error(`AI Generation failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message}`);
}

// Helper to prevent leaking too much internal error info if needed, 
// but for AI repair, detailed errors are actually better.
function filterSchemaErrorMessage(msg: string): string {
    return msg.substring(0, 1000); // Truncate if insanely long
}
