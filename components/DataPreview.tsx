import React from 'react';
import { DataRow, DataQualityReport } from '../types';

interface Props {
    data: DataRow[];
    report: DataQualityReport | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DataPreview: React.FC<Props> = ({ data, report, onConfirm, onCancel }) => {
    return (
        <div>
            <h1>Data Preview (Placeholder)</h1>
            <p>This component is not currently used. See EmbeddedDataPreview.</p>
            <button onClick={onConfirm}>Confirm</button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    );
};
