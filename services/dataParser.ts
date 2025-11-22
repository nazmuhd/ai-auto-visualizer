import { DataRow, DataQualityReport } from '../types.ts';
import * as XLSX from 'xlsx';

// --- Core Logic ---

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


// --- Exported Main Thread Processor ---
export const processFile = async (
    file: File,
    onProgress: (status: string, percentage: number) => void
): Promise<{ data: DataRow[], report: DataQualityReport, sample: DataRow[] }> => {
    try {
        console.log("Using main thread for file processing.");
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
