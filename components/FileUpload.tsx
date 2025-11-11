import React, { useCallback, useState } from 'react';
import { UploadCloud, FileType, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

interface Props {
    onFileSelect: (file: File) => void;
    isLoading: boolean;
    error: string | null;
}

export const FileUpload: React.FC<Props> = ({ onFileSelect, isLoading, error }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            validateAndPass(files[0]);
        }
    }, [onFileSelect]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            validateAndPass(files[0]);
        }
    }, [onFileSelect]);

    const validateAndPass = (file: File) => {
        // Basic validation, though generic parser might handle more
        const validTypes = [
            'text/csv', 
            'application/vnd.ms-excel', 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/pdf'
        ];
        // Rely more on extension as mime types can sometimes be weird on different OS
        const validExtensions = ['.csv', '.xls', '.xlsx', '.pdf'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (validTypes.includes(file.type) || validExtensions.includes(ext)) {
            onFileSelect(file);
        } else {
             alert("Please upload a valid CSV, Excel, or PDF file.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-4 bg-slate-50">
            <div className="text-center max-w-2xl mb-10">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
                    Visualize your data <span className="text-primary-600">instantly</span>.
                </h1>
                <p className="text-lg text-slate-600">
                    Upload your Spreadsheet and let our AI build a D3.js dashboard for you in seconds.
                </p>
            </div>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full max-w-xl p-12 bg-white rounded-2xl border-2 border-dashed transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center
                    ${isDragging ? 'border-primary-500 bg-primary-50 scale-[1.02]' : 'border-slate-300 hover:border-primary-400 hover:shadow-lg'}
                    ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                {isLoading ? (
                     <div className="flex flex-col items-center animate-pulse">
                        <Loader2 className="h-16 w-16 text-primary-500 animate-spin mb-4" />
                        <p className="text-xl font-semibold text-slate-700">Analyzing your data...</p>
                        <p className="text-sm text-slate-500 mt-2">This might take a few moments.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-primary-100 text-primary-600 rounded-full mb-6">
                            <UploadCloud size={40} />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            Drag & drop your file here
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Support for .CSV, .XLSX, .XLS
                        </p>
                        <label className="relative cursor-pointer bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-xl shadow-sm transition-colors focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                            <span>Browse files</span>
                            <input 
                                type="file" 
                                className="sr-only" 
                                onChange={handleFileInput} 
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, .xlsx, .xls, .pdf"
                            />
                        </label>
                    </>
                )}
            </div>

            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start max-w-xl text-red-700 animate-in fade-in slide-in-from-bottom-4">
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center max-w-3xl w-full">
                 <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                    <div className="mx-auto w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg mb-3">
                        <FileType size={20} />
                    </div>
                    <h4 className="font-semibold text-slate-900">Upload Data</h4>
                    <p className="text-sm text-slate-500 mt-1">We support common tabular formats.</p>
                 </div>
                 <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                    <div className="mx-auto w-10 h-10 flex items-center justify-center bg-purple-100 text-purple-600 rounded-lg mb-3">
                        <Loader2 size={20} />
                    </div>
                    <h4 className="font-semibold text-slate-900">AI Analysis</h4>
                    <p className="text-sm text-slate-500 mt-1">Gemini identifies the best charts.</p>
                 </div>
                 <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                    <div className="mx-auto w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-lg mb-3">
                        <BarChart3 size={20} />
                    </div>
                    <h4 className="font-semibold text-slate-900">D3.js Render</h4>
                    <p className="text-sm text-slate-500 mt-1">Interactive, beautiful charts.</p>
                 </div>
            </div>
        </div>
    );
};