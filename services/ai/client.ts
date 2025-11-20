
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client with the environment key
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
