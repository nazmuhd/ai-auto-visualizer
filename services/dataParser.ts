
import * as XLSX from 'xlsx';
import { DataRow, DataQualityReport, DataIssue } from '../types';

export const parseFile = async (file: File): Promise<DataRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("No data read from file");

        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Use raw:false to get formatted strings for dates initially, 
        // but we might want raw values later. generic conversion for now.
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null }) as DataRow[];

        if (jsonData.length === 0) {
            reject(new Error("File appears to be empty"));
            return;
        }
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);

    // Read as binary string for robust XLSX/XLS/CSV handling by the library
    reader.readAsBinaryString(file);
  });
};

export const validateData = (data: DataRow[]): DataQualityReport => {
    const issues: DataIssue[] = [];
    let score = 100;
    const rowCount = data.length;
    const columnCount = rowCount > 0 ? Object.keys(data[0]).length : 0;

    if (rowCount === 0) {
        return { score: 0, issues: [{ type: 'empty_file', severity: 'high', title: 'Empty Dataset', description: 'The file contains no data rows.' }], rowCount, columnCount, isClean: false };
    }

    // 1. Check for missing values (naive check for null/undefined/empty string)
    let missingCount = 0;
    const totalCells = rowCount * columnCount;
    
    // Sample first 1000 rows for performance if dataset is huge
    const sampleLimit = Math.min(rowCount, 1000);
    for (let i = 0; i < sampleLimit; i++) {
        const row = data[i];
        for (const key in row) {
            if (row[key] === null || row[key] === undefined || row[key] === '') {
                missingCount++;
            }
        }
    }

    // Extrapolate if sampled
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

    // 2. Check for potential duplicates (simple stringify check on sample)
    const seen = new Set<string>();
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

// Helper to sample data for AI to save tokens. 
// Reduced default to 15 for faster payloads while still giving enough context.
export const sampleData = (data: DataRow[], limit: number = 15): DataRow[] => {
    return data.slice(0, limit);
}
