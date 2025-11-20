
import { useState, useCallback } from 'react';
import { processFile as processFileService } from '../services/dataParser.ts';
import { DataQualityReport, DataRow } from '../types.ts';

export interface ProcessingProgress {
    status: string;
    percentage: number;
}

export const useDataProcessing = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<ProcessingProgress | null>(null);
    const [report, setReport] = useState<DataQualityReport | null>(null);
    
    const processFile = useCallback(async (file: File): Promise<{ data: DataRow[], report: DataQualityReport, sample: DataRow[] } | undefined> => {
        setIsProcessing(true);
        setError(null);
        setProgress({ status: 'Initiating...', percentage: 0 });
        setReport(null);

        try {
            const result = await processFileService(file, (status, percentage) => {
                setProgress({ status, percentage });
            });
            setReport(result.report);
            return result;
        } catch (err: any) {
            setError(err.message || "Error processing file.");
            return undefined;
        } finally {
            setIsProcessing(false);
            // Keep progress visible for a moment or let caller clear it? 
            // We'll leave it to the caller to reset if they want, but usually we stop "loading" UI
        }
    }, []);

    const resetProcessing = useCallback(() => {
        setIsProcessing(false);
        setError(null);
        setProgress(null);
        setReport(null);
    }, []);

    return {
        processFile,
        isProcessing,
        error,
        progress,
        report,
        resetProcessing,
        setError
    };
};
