import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { SaveStatus } from '../../../types.ts';

interface Props {
    status: SaveStatus;
}

export const SaveStatusIndicator: React.FC<Props> = ({ status }) => {
    switch (status) {
        case 'unsaved':
            return (
                <div className="flex items-center text-sm font-semibold text-amber-700">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2 animate-pulse"></div>
                    Unsaved Changes
                </div>
            );
        case 'saving':
            return (
                <div className="flex items-center text-xs text-slate-500">
                    <Loader2 size={12} className="mr-2 animate-spin" /> Saving...
                </div>
            );
        case 'saved':
            return (
                <div className="flex items-center text-xs text-green-600">
                    <CheckCircle size={12} className="mr-2" /> All changes saved
                </div>
            );
        default:
            return <div className="h-5" />; // Placeholder for alignment
    }
};
