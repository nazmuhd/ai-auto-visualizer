// Import the XLSX library. In a worker, we use importScripts.
// NOTE: The 'XLSX' variable will be available in the global scope after this runs.
importScripts('https://aistudiocdn.com/xlsx@0.18.5/dist/xlsx.full.min.js');

// FIX: Declare the XLSX global variable that is loaded via `importScripts`.
// This informs TypeScript that the variable exists at runtime, resolving compile-time errors.
declare const XLSX: any;

// Type definitions are manually duplicated here because workers can't use ES module imports.
type DataRow = Record<string, any>;
interface DataIssue {
    type: 'missing_values' | 'duplicates' | 'data_type_mismatch' | 'empty_file';
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
}
interface DataQualityReport {
    score: number;
    issues: DataIssue[];
    rowCount: number;
    columnCount: number;
    isClean: boolean;
}


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


self.onmessage = async (event: MessageEvent) => {
    const file = event.data as File;
    try {
        self.postMessage({ type: 'progress', payload: { status: 'Parsing file...', percentage: 25 } });
        
        const fileData = await file.arrayBuffer();
        const parsedData = await parseFileContents(fileData);

        self.postMessage({ type: 'progress', payload: { status: 'Validating data quality...', percentage: 75 } });
        const report = validateData(parsedData);

        self.postMessage({ type: 'progress', payload: { status: 'Generating smart sample for AI...', percentage: 90 } });
        const smartSample = sampleData(parsedData);

        self.postMessage({ 
            type: 'result', 
            payload: { data: parsedData, report, sample: smartSample }
        });

    } catch (error: any) {
        self.postMessage({ type: 'error', payload: error.message });
    }
};