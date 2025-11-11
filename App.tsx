
import React, { useState, useCallback, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataScanner } from './components/DataScanner';
import { DataPreview } from './components/DataPreview';
import { Dashboard } from './components/Dashboard';
import { parseFile, sampleData, validateData } from './services/dataParser';
import { analyzeData } from './services/geminiService';
import { AnalysisResult, DataRow, LoadingState, DataQualityReport, ChartConfig } from './types';

const App: React.FC = () => {
    const [data, setData] = useState<DataRow[] | null>(null);
    const [validationReport, setValidationReport] = useState<DataQualityReport | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [status, setStatus] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);

    // Ref to hold the running analysis promise for pre-fetching
    const analysisPromiseRef = useRef<Promise<AnalysisResult> | null>(null);

    const handleFileSelect = async (file: File) => {
        setStatus('parsing');
        setError(null);

        try {
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                 throw new Error("PDF support is currently in beta. Please use CSV or Excel for best results.");
            }

            const parsedData = await parseFile(file);
            setData(parsedData);
            
            // --- PERFORMANCE BOOST: Start AI analysis immediately in background ---
            // We don't await it here. We let it run while the user does other things.
            const sample = sampleData(parsedData, 15); // Use smaller sample for speed
            analysisPromiseRef.current = analyzeData(sample)
                .catch(err => {
                    // We catch here to prevent unhandled rejection, 
                    // but we'll re-throw when the user actually asks for the result.
                    console.warn("Background analysis failed (will retry if user confirms):", err);
                    throw err;
                });
            // ---------------------------------------------------------------------

            setStatus('scanning');

        } catch (err: any) {
            console.error("Error processing file:", err);
            setError(err.message || "An unexpected error occurred while processing your file.");
            setStatus('error');
            setData(null);
        }
    };

    const handleScanComplete = useCallback(() => {
        if (data) {
            // Validation is fast, can run synchronously on the main thread for now
            const report = validateData(data);
            setValidationReport(report);
            setStatus('validated');
        } else {
            setStatus('error');
            setError("Data lost during scan.");
        }
    }, [data]);

    const handleConfirmPreview = async () => {
        if (!data) return;
        
        setStatus('analyzing');
        try {
            // If analysis was pre-fetched and is running (or done), await it.
            // If it hasn't started for some reason, start it now.
            let result: AnalysisResult;
            if (analysisPromiseRef.current) {
                result = await analysisPromiseRef.current;
            } else {
                const sample = sampleData(data, 15);
                result = await analyzeData(sample);
            }
            
            setAnalysis(result);
            setStatus('complete');
        } catch (err: any) {
             console.error("Error analyzing data:", err);
             setError(err.message || "Failed to analyze data with AI. Please try again.");
             setStatus('error');
             analysisPromiseRef.current = null; // Reset on error to allow retry
        }
    };

    const handleChartUpdate = (updatedChart: ChartConfig) => {
        if (!analysis) return;
        setAnalysis({
            ...analysis,
            charts: analysis.charts.map(c => c.id === updatedChart.id ? updatedChart : c)
        });
    };

    const handleReset = () => {
        setData(null);
        setValidationReport(null);
        setAnalysis(null);
        setStatus('idle');
        setError(null);
        analysisPromiseRef.current = null;
    };

    return (
        <div className="h-screen bg-slate-50 text-slate-900">
            {status === 'scanning' && (
                <DataScanner onComplete={handleScanComplete} />
            )}

            {status === 'validated' && data && (
                <DataPreview 
                    data={data}
                    report={validationReport}
                    onConfirm={handleConfirmPreview} 
                    onCancel={handleReset} 
                />
            )}

            {status === 'complete' && data && analysis && (
                <Dashboard 
                    data={data} 
                    analysis={analysis} 
                    onReset={handleReset}
                    onUpdateChart={handleChartUpdate}
                />
            )}

            {(status === 'idle' || status === 'parsing' || status === 'analyzing' || status === 'error') && (
                <FileUpload 
                    onFileSelect={handleFileSelect} 
                    isLoading={status === 'parsing' || status === 'analyzing'}
                    error={error}
                />
            )}
        </div>
    );
};

export default App;
