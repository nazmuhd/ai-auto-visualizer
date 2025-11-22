
// This file acts as a facade/barrel file for the specialized AI services.
// It preserves backward compatibility for components importing from 'services/geminiService.ts'
// while directing them to the new, modular architecture in 'services/ai/*.ts'.

export { analyzeData, generateChartInsight } from './ai/analysisService.ts';
export { generateInitialPresentation, improveText, addSlideWithAI, editSlideWithAI } from './ai/presentationService.ts';
export { queryDataWithAI, generateFormulaFromNaturalLanguage } from './ai/queryService.ts';
