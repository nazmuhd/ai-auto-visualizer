
import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { analyzeData as analyzeDataService } from '../services/ai/analysisService.ts';
import { generateInitialPresentation } from '../services/ai/presentationService.ts';
import { queryDataWithAI, generateFormulaFromNaturalLanguage } from '../services/ai/queryService.ts';
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
    // We still keep local progress state because useMutation's 'pending' is just a boolean,
    // and we want to show granular progress updates which are simulated.
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
                if (progressInterval.current) clearInterval(progressInterval.current);
            }
        }, 1500);
    };

    const stopProgressSimulation = () => {
        if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
        }
        setAnalysisProgress(null);
    };

    // -- Mutation: Analyze Data --
    const analysisMutation = useMutation({
        mutationFn: async (sample: DataRow[]) => {
            return await analyzeDataService(sample);
        },
        onMutate: () => {
            startProgressSimulation(ANALYSIS_STEPS);
        },
        onSettled: () => {
            stopProgressSimulation();
        }
    });

    // -- Mutation: Generate Presentation --
    const presentationMutation = useMutation({
        mutationFn: async (params: { analysis: AnalysisResult, template: ReportTemplate, projectName: string }) => {
            return await generateInitialPresentation(params.analysis, params.template, params.projectName);
        },
        onMutate: () => {
            startProgressSimulation(REPORT_STEPS);
        },
        onSettled: () => {
            stopProgressSimulation();
        }
    });

    // -- Mutation: Ask AI (Data Studio) --
    const queryDataMutation = useMutation({
        mutationFn: async (params: { data: DataRow[], question: string }) => {
            return await queryDataWithAI(params.data, params.question);
        }
    });

    // -- Mutation: Generate Formula (Data Studio) --
    const formulaMutation = useMutation({
        mutationFn: async (params: { query: string, columns: string[] }) => {
            return await generateFormulaFromNaturalLanguage(params.query, params.columns);
        }
    });

    const analyzeData = useCallback(async (sample: DataRow[]): Promise<AnalysisResult | undefined> => {
        try {
            return await analysisMutation.mutateAsync(sample);
        } catch (error) {
            console.error("Analysis failed", error);
            return undefined;
        }
    }, [analysisMutation]);

    const generatePresentation = useCallback(async (analysis: AnalysisResult, template: ReportTemplate, projectName: string): Promise<Presentation | undefined> => {
        try {
            return await presentationMutation.mutateAsync({ analysis, template, projectName });
        } catch (error) {
            console.error("Presentation generation failed", error);
            return undefined;
        }
    }, [presentationMutation]);

    const queryData = useCallback(async (data: DataRow[], question: string): Promise<string | undefined> => {
        try {
            return await queryDataMutation.mutateAsync({ data, question });
        } catch (error) {
            console.error("Data query failed", error);
            throw error;
        }
    }, [queryDataMutation]);

    const generateFormula = useCallback(async (query: string, columns: string[]): Promise<string | undefined> => {
        try {
            return await formulaMutation.mutateAsync({ query, columns });
        } catch (error) {
            console.error("Formula generation failed", error);
            throw error;
        }
    }, [formulaMutation]);
    
    const resetGemini = useCallback(() => {
        stopProgressSimulation();
        analysisMutation.reset();
        presentationMutation.reset();
        queryDataMutation.reset();
        formulaMutation.reset();
    }, [analysisMutation, presentationMutation, queryDataMutation, formulaMutation]);

    return {
        analyzeData,
        generatePresentation,
        queryData,
        generateFormula,
        // Unified loading state
        isAnalyzing: analysisMutation.isPending || presentationMutation.isPending,
        isQuerying: queryDataMutation.isPending,
        isGeneratingFormula: formulaMutation.isPending,
        // Unified error state message
        analysisError: analysisMutation.error?.message || presentationMutation.error?.message || null,
        analysisProgress,
        resetGemini
    };
};
