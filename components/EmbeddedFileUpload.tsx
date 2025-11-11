
import React, { useCallback, useState } from 'react';
import { UploadCloud, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
    onFileSelect: (file: File) => void;
    isLoading: boolean;
    error: string | null;
    progress: { status: string, percentage: number } | null;
}

export const EmbeddedFileUpload: React.FC<Props> = ({ onFileSelect, isLoading, error, progress }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

    const validateAndPass = (file: File) => {
        const validExtensions = ['.csv', '.xls', '.xlsx'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (validExtensions.includes(ext)) {
            onFileSelect(file);
        } else {
             alert("Please upload a valid CSV or Excel file.");
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) validateAndPass(files[0]);
    }, [onFileSelect]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) validateAndPass(files[0]);
    }, [onFileSelect]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full max-w-xl p-12 bg-white rounded-2xl border-2 border-dashed transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center
                    ${isDragging ? 'border-primary-500 bg-primary-50 scale-[1.02]' : 'border-slate-300 hover:border-primary-400'}
                    ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                {isLoading ? (
                     <div className="flex flex-col items-center w-full">
                        <Loader2 className="h-12 w-12 text-primary-500 animate-spin mb-4" />
                        <p className="text-lg font-semibold text-slate-700">{progress?.status || 'Processing...'}</p>
                        <p className="text-sm text-slate-500 mt-1">This can take a moment for large files.</p>
                         <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4">
                            <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress?.percentage || 0}%`, transition: 'width 0.5s ease-in-out' }}></div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-primary-100 text-primary-600 rounded-full mb-6">
                            <UploadCloud size={40} />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            Upload a new file to analyze
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Drag & drop or browse from your computer.
                        </p>
                        <label className="relative cursor-pointer bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-xl shadow-sm transition-colors focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                            <span>Browse files</span>
                            <input 
                                type="file" 
                                className="sr-only" 
                                onChange={handleFileInput} 
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, .xlsx, .xls"
                            />
                        </label>
                    </>
                )}
            </div>
             {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start max-w-xl text-red-700">
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};
