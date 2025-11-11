import { DataRow, DataQualityReport } from '../types.ts';

// The worker script is now inlined without the importScripts call.
// The xlsx library will be prepended to this script by the main thread.
const workerScript = `
// --- Worker Logic (self-contained, no external TS/imports) ---
// The XLSX library is pre-loaded in the worker's global scope.

const parseFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("No data read from file");

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
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
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
        const parsedData = await parseFile(file);

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
`;

// --- New code to manage the self-contained worker ---

// Cache for the fetched library to avoid re-fetching on every upload.
let xlsxScriptCache: string | null = null;

// Fetches the xlsx library script text.
async function getXlsxScript(): Promise<string> {
    if (xlsxScriptCache) {
        return xlsxScriptCache;
    }
    try {
        const response = await fetch('https://aistudiocdn.com/xlsx@0.18.5/dist/xlsx.full.min.js');
        if (!response.ok) {
            throw new Error(`Failed to fetch xlsx library: ${response.statusText}`);
        }
        xlsxScriptCache = await response.text();
        return xlsxScriptCache;
    } catch (error) {
        console.error("Could not load xlsx library for worker", error);
        throw new Error("A core library required for file parsing could not be loaded. Please check your network connection and try again.");
    }
}

export const processFileWithWorker = (
    file: File, 
    onProgress: (status: string, percentage: number) => void
): Promise<{ data: DataRow[], report: DataQualityReport, sample: DataRow[] }> => {
    // This promise executor is now async to allow awaiting the library fetch.
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Fetch the library code.
            const xlsxScript = await getXlsxScript();
            
            // 2. Combine the library and the worker logic into one script.
            const fullWorkerScript = xlsxScript + '\n' + workerScript;
            
            // 3. Create the worker from a Blob, making it self-contained.
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

            worker.onerror = (error) => {
                reject(error);
                cleanup();
            };
            
            worker.postMessage(file);

        } catch (error) {
            // This will catch errors from getXlsxScript (e.g., network failure).
            reject(error);
        }
    });
};