
import { DataRow } from '../types.ts';

/**
 * Largest-Triangle-Three-Buckets (LTTB) Downsampling Algorithm
 * Effectively reduces the number of data points while preserving the visual shape/trends.
 */
export const lttb = (data: DataRow[], threshold: number, xKey: string, yKey: string): DataRow[] => {
    const dataLength = data.length;
    if (threshold >= dataLength || threshold === 0) return data;

    const sampled: DataRow[] = [];
    let sampledIndex = 0;

    // Bucket size. Leave room for start and end data points
    const every = (dataLength - 2) / (threshold - 2);

    let a = 0;
    let maxAreaPoint: DataRow | null = null;
    let maxArea = 0;
    let area = 0;
    let nextA = 0;

    // Always add the first point
    sampled[sampledIndex++] = data[a];

    for (let i = 0; i < threshold - 2; i++) {
        // Calculate point average for next bucket (containing c)
        let avgX = 0;
        let avgY = 0;
        let avgRangeStart = Math.floor((i + 1) * every) + 1;
        let avgRangeEnd = Math.floor((i + 2) * every) + 1;
        avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;

        const avgRangeLength = avgRangeEnd - avgRangeStart;

        for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
            const valX = Number(data[avgRangeStart][xKey]) || 0; // Simple cast, assumes numeric/date-numeric
            const valY = Number(data[avgRangeStart][yKey]) || 0;
            avgX += valX;
            avgY += valY;
        }
        avgX /= avgRangeLength;
        avgY /= avgRangeLength;

        // Get the range for this bucket
        let rangeOffs = Math.floor((i + 0) * every) + 1;
        const rangeTo = Math.floor((i + 1) * every) + 1;

        // Point a
        const pointAX = Number(data[a][xKey]) || 0;
        const pointAY = Number(data[a][yKey]) || 0;

        maxArea = -1;
        maxAreaPoint = null;

        for (; rangeOffs < rangeTo; rangeOffs++) {
            // Calculate triangle area over three buckets
            const pointBX = Number(data[rangeOffs][xKey]) || 0;
            const pointBY = Number(data[rangeOffs][yKey]) || 0;

            area = Math.abs(
                (pointAX - avgX) * (pointBY - pointAY) -
                (pointAX - pointBX) * (avgY - pointAY)
            ) * 0.5;

            if (area > maxArea) {
                maxArea = area;
                maxAreaPoint = data[rangeOffs];
                nextA = rangeOffs; // Next a is this b
            }
        }

        if (maxAreaPoint) {
            sampled[sampledIndex++] = maxAreaPoint;
            a = nextA; // This a is the next a (chosen b)
        }
    }

    // Always add the last point
    sampled[sampledIndex++] = data[dataLength - 1];

    return sampled;
};
