
import { useState, useCallback, useRef } from 'react';
import { analyzeData as analyzeDataService, generateInitialPresentation } from '../services/geminiService.ts';
import { DataRow, AnalysisResult, ReportTemplate, Presentation } from '../types.ts';

const ANALYSIS_STEPS = [
    { status: 'Scanning data structure...', pct: 10 },
    { status: 'Identifying categorical vs numerical fields...', pct: 25 },
    { status: 'Calculating column correlations...', pct: 45 },
    { status: 'Detecting outliers and trends...', pct: 65 },
    { status: 'Selecting optimal chart visualizations...', pct: 80 },
    { status: 'Finalizing dashboard layout...', pct: 95 },
];

const REPORT_STEPS = [
    { status: 'Analyzing dashboard insights...', pct: 10 },
    { status: 'Structuring presentation flow...', pct: 30 },
    { status: 'Drafting executive summary...', pct: 50 },
    { status: 'Generating slide layouts...', pct: 70 },
    { status: 'Applying visual theme and formatting...', pct: 85 },
    { status: 'Finalizing presentation...', pct: 95 },
];

export const useGemini = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState<{ status: string, percentage: number } | null>(null);
    
    const progressInterval = useRef<number | null>(null);

    const startProgressSimulation = (steps: typeof ANALYSIS_STEPS) => {
        let stepIndex = 0;
        setAnalysisProgress({ status: steps[0].status, percentage: steps[0].pct });

        if (progressInterval.current) clearInterval(progressInterval.current);

        progressInterval.current = window.setInterval(() => {
            stepIndex++;
            if (stepIndex < steps.length) {
                setAnalysisProgress({ status: steps[stepIndex].status, percentage: steps[stepIndex].pct });
            } else {
                // Just hold at the last step
                if (progressInterval.current) clearInterval(progressInterval.current);
            }
        }, 1500); // Change step every 1.5 seconds
    };

    const stopProgressSimulation = () => {
        if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
        }
    };

    const analyzeData = useCallback(async (sample: DataRow[]): Promise<AnalysisResult | undefined> => {
        setIsAnalyzing(true);
        setAnalysisError(null);
        startProgressSimulation(ANALYSIS_STEPS);
        
        try {
            const result = await analyzeDataService(sample);
            return result;
        } catch (err: any) {
            setAnalysisError(err.message || "Failed to analyze data.");
            return undefined;
        } finally {
            stopProgressSimulation();
            setIsAnalyzing(false);
            setAnalysisProgress(null);
        }
    }, []);

    const generatePresentation = useCallback(async (analysis: AnalysisResult, template: ReportTemplate, projectName: string): Promise<Presentation | undefined> => {
        setIsAnalyzing(true);
        setAnalysisError(null);
        startProgressSimulation(REPORT_STEPS);

        try {
            const presentation = await generateInitialPresentation(analysis, template, projectName);
            return presentation;
        } catch (err: any) {
            setAnalysisError(err.message || "Failed to generate presentation.");
            return undefined;
        } finally {
            stopProgressSimulation();
            setIsAnalyzing(false);
            setAnalysisProgress(null);
        }
    }, []);
    
    const resetGemini = useCallback(() => {
        stopProgressSimulation();
        setIsAnalyzing(false);
        setAnalysisError(null);
        setAnalysisProgress(null);
    }, []);

    return {
        analyzeData,
        generatePresentation,
        isAnalyzing,
        analysisError,
        analysisProgress,
        resetGemini
    };
};
