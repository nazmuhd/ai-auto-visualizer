import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface Props {
    onFileSelect: (file: File) => void;
}

export const FileUploadContainer: React.FC<Props> = ({ onFileSelect }) => {
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
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full p-6 bg-white rounded-xl border-2 border-dashed transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center
                ${isDragging ? 'border-primary-500 bg-primary-50/50 scale-[1.02]' : 'border-slate-300 hover:border-primary-400'}
            `}
        >
            <UploadCloud size={32} className="text-slate-400 mb-2" />
            <p className="text-slate-500 text-sm mb-3">
                Drag & drop or <label htmlFor="file-upload-input" className="text-primary-600 font-semibold hover:underline cursor-pointer">browse</label>
            </p>
            <input 
                id="file-upload-input"
                type="file" 
                className="sr-only" 
                onChange={handleFileInput} 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, .xlsx, .xls"
            />
        </div>
    );
};