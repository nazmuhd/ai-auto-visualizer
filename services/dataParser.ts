import { DataRow, DataQualityReport } from '../types.ts';
import * as XLSX from 'xlsx';

// --- Environment Toggle ---
// Set to 'true' to use the Web Worker (production).
// Set to 'false' to parse on the main thread (development/testing).
const USE_WEB_WORKER = false;

// --- Core Logic (shared between worker and main thread) ---

const parseFileContents = (data: ArrayBuffer): Promise<DataRow[]> => {
    return new Promise((resolve, reject) => {
        try {
            const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null }) as DataRow[];

            if (jsonData.length === 0) {
                reject(new Error("File appears to be empty or unreadable."));
                return;
            }
            resolve(jsonData);
        } catch (error) {
            reject(error);
        }
    });
};


const validateData = (data: DataRow[]): DataQualityReport => {
    const issues = [];
    let score = 100;
    const rowCount = data.length;
    const columnCount = rowCount > 0 ? Object.keys(data[0]).length : 0;

    if (rowCount === 0) {
        return { score: 0, issues: [{ type: 'empty_file', severity: 'high', title: 'Empty Dataset', description: 'The file contains no data rows.' }], rowCount, columnCount, isClean: false };
    }

    let missingCount = 0;
    const totalCells = rowCount * columnCount;
    
    const sampleLimit = Math.min(rowCount, 1000);
    for (let i = 0; i < sampleLimit; i++) {
        const row = data[i];
        for (const key in row) {
            if (row[key] === null || row[key] === undefined || row[key] === '') {
                missingCount++;
            }
        }
    }

    const estimatedMissing = (missingCount / (sampleLimit * columnCount)) * totalCells;
    const missingPercentage = (estimatedMissing / totalCells) * 100;

    if (missingPercentage > 20) {
        score -= 30;
        issues.push({
            type: 'missing_values',
            severity: 'high',
            title: 'High Missing Data',
            description: `Approximately ${missingPercentage.toFixed(0)}% of cells are empty. This may affect analysis accuracy.`
        });
    } else if (missingPercentage > 5) {
         score -= 10;
         issues.push({
            type: 'missing_values',
            severity: 'medium',
            title: 'Missing Values Detected',
            description: 'Some rows have missing data. Charts will automatically handle or ignore these.'
        });
    }

    const seen = new Set();
    let duplicates = 0;
    for (let i = 0; i < sampleLimit; i++) {
        const rowStr = JSON.stringify(data[i]);
        if (seen.has(rowStr)) {
            duplicates++;
        } else {
            seen.add(rowStr);
        }
    }

    if (duplicates > 0) {
        const dupRate = (duplicates / sampleLimit) * 100;
        if (dupRate > 10) {
             score -= 20;
             issues.push({ type: 'duplicates', severity: 'medium', title: 'Duplicate Rows', description: `Found approximately ${dupRate.toFixed(0)}% duplicate rows.` });
        }
    }

    return {
        score: Math.max(0, score),
        issues,
        rowCount,
        columnCount,
        isClean: issues.filter(i => i.severity === 'high').length === 0
    };
};

const sampleData = (data: DataRow[]): DataRow[] => {
    if (data.length <= 20) {
        return data;
    }
    const head = data.slice(0, 7);
    const midIndex = Math.floor(data.length / 2) - 3;
    const middle = data.slice(midIndex, midIndex + 6);
    const tail = data.slice(data.length - 7);
    return [...head, ...middle, ...tail];
};


// --- Main Thread Processor (for Development) ---
const processFileOnMainThread = async (
    file: File,
    onProgress: (status: string, percentage: number) => void
): Promise<{ data: DataRow[], report: DataQualityReport, sample: DataRow[] }> => {
    try {
        onProgress('Parsing file...', 25);
        const data = await file.arrayBuffer();
        const parsedData = await parseFileContents(data);

        onProgress('Validating data quality...', 75);
        const report = validateData(parsedData);

        onProgress('Generating smart sample for AI...', 90);
        const smartSample = sampleData(parsedData);

        return { data: parsedData, report, sample: smartSample };
    } catch (error: any) {
        console.error("Main thread parsing error:", error);
        throw new Error(error.message || "An unexpected error occurred during file processing.");
    }
};


// --- Web Worker Processor (for Production) ---

const workerScript = `
// The XLSX library is pre-loaded in the worker's global scope.

// NOTE: The core logic functions (parseFileContents, validateData, sampleData) are duplicated here
// to make the worker self-contained, as it cannot share scope with the main module.

const parseFileContents = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });

            if (jsonData.length === 0) {
                reject(new Error("File appears to be empty or unreadable."));
                return;
            }
            resolve(jsonData);
        } catch (error) {
            reject(error);
        }
    });
};


const validateData = (data) => {
    const issues = [];
    let score = 100;
    const rowCount = data.length;
    const columnCount = rowCount > 0 ? Object.keys(data[0]).length : 0;

    if (rowCount === 0) {
        return { score: 0, issues: [{ type: 'empty_file', severity: 'high', title: 'Empty Dataset', description: 'The file contains no data rows.' }], rowCount, columnCount, isClean: false };
    }

    let missingCount = 0;
    const totalCells = rowCount * columnCount;
    
    const sampleLimit = Math.min(rowCount, 1000);
    for (let i = 0; i < sampleLimit; i++) {
        const row = data[i];
        for (const key in row) {
            if (row[key] === null || row[key] === undefined || row[key] === '') {
                missingCount++;
            }
        }
    }

    const estimatedMissing = (missingCount / (sampleLimit * columnCount)) * totalCells;
    const missingPercentage = (estimatedMissing / totalCells) * 100;

    if (missingPercentage > 20) {
        score -= 30;
        issues.push({
            type: 'missing_values',
            severity: 'high',
            title: 'High Missing Data',
            description: \`Approximately \${missingPercentage.toFixed(0)}% of cells are empty. This may affect analysis accuracy.\`
        });
    } else if (missingPercentage > 5) {
         score -= 10;
         issues.push({
            type: 'missing_values',
            severity: 'medium',
            title: 'Missing Values Detected',
            description: 'Some rows have missing data. Charts will automatically handle or ignore these.'
        });
    }

    const seen = new Set();
    let duplicates = 0;
    for (let i = 0; i < sampleLimit; i++) {
        const rowStr = JSON.stringify(data[i]);
        if (seen.has(rowStr)) {
            duplicates++;
        } else {
            seen.add(rowStr);
        }
    }

    if (duplicates > 0) {
        const dupRate = (duplicates / sampleLimit) * 100;
        if (dupRate > 10) {
             score -= 20;
             issues.push({ type: 'duplicates', severity: 'medium', title: 'Duplicate Rows', description: \`Found approximately \${dupRate.toFixed(0)}% duplicate rows.\` });
        }
    }

    return {
        score: Math.max(0, score),
        issues,
        rowCount,
        columnCount,
        isClean: issues.filter(i => i.severity === 'high').length === 0
    };
};

const sampleData = (data) => {
    if (data.length <= 20) {
        return data;
    }
    const head = data.slice(0, 7);
    const midIndex = Math.floor(data.length / 2) - 3;
    const middle = data.slice(midIndex, midIndex + 6);
    const tail = data.slice(data.length - 7);
    return [...head, ...middle, ...tail];
};


self.onmessage = async (event) => {
    const file = event.data;
    try {
        self.postMessage({ type: 'progress', payload: { status: 'Parsing file...', percentage: 25 } });
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const fileData = e.target.result;
                const parsedData = await parseFileContents(fileData);

                self.postMessage({ type: 'progress', payload: { status: 'Validating data quality...', percentage: 75 } });
                const report = validateData(parsedData);

                self.postMessage({ type: 'progress', payload: { status: 'Generating smart sample for AI...', percentage: 90 } });
                const smartSample = sampleData(parsedData);

                self.postMessage({ 
                    type: 'result', 
                    payload: { data: parsedData, report, sample: smartSample }
                });
            } catch (error) {
                 self.postMessage({ type: 'error', payload: error.message });
            }
        };
        reader.onerror = (error) => { throw error };
        reader.readAsBinaryString(file);
    } catch (error) {
        self.postMessage({ type: 'error', payload: error.message });
    }
};
`;

let xlsxScriptCache: string | null = null;
async function getXlsxScript(): Promise<string> {
    if (xlsxScriptCache) return xlsxScriptCache;
    try {
        const response = await fetch('https://aistudiocdn.com/xlsx@0.18.5/dist/xlsx.full.min.js');
        if (!response.ok) throw new Error(`Failed to fetch xlsx library: ${response.statusText}`);
        xlsxScriptCache = await response.text();
        return xlsxScriptCache;
    } catch (error) {
        console.error("Could not load xlsx library for worker", error);
        throw new Error("A core library required for file parsing could not be loaded. Please check your network connection and try again.");
    }
}

const processFileWithWorker = (
    file: File, 
    onProgress: (status: string, percentage: number) => void
): Promise<{ data: DataRow[], report: DataQualityReport, sample: DataRow[] }> => {
    return new Promise(async (resolve, reject) => {
        try {
            const xlsxScript = await getXlsxScript();
            const fullWorkerScript = xlsxScript + '\n' + workerScript;
            const blob = new Blob([fullWorkerScript], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            const worker = new Worker(workerUrl);
            
            const cleanup = () => {
                URL.revokeObjectURL(workerUrl);
                worker.terminate();
            };

            worker.onmessage = (event) => {
                const { type, payload } = event.data;
                if (type === 'progress') {
                    onProgress(payload.status, payload.percentage);
                } else if (type === 'result') {
                    resolve(payload);
                    cleanup();
                } else if (type === 'error') {
                    reject(new Error(payload));
                    cleanup();
                }
            };

            worker.onerror = (error) => { reject(error); cleanup(); };
            worker.postMessage(file);

        } catch (error) {
            reject(error);
        }
    });
};

// --- Exported Router Function ---
export const processFile = (
    file: File,
    onProgress: (status: string, percentage: number) => void
): Promise<{ data: DataRow[], report: DataQualityReport, sample: DataRow[] }> => {
    if (USE_WEB_WORKER) {
        console.log("Using Web Worker for file processing.");
        return processFileWithWorker(file, onProgress);
    } else {
        console.log("Using main thread for file processing (Development Mode).");
        return processFileOnMainThread(file, onProgress);
    }
};
