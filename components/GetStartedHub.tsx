import React from 'react';
import { FolderPlus, Loader2, AlertCircle } from 'lucide-react';

interface Props {
    onAnalyzeFile: (file: File) => void;
    onCreateProject: () => void;
    isLoading: boolean;
    error: string | null;
    progress: { status: string, percentage: number } | null;
}

export const GetStartedHub: React.FC<Props> = ({ onAnalyzeFile, onCreateProject, isLoading, error, progress }) => {
    
    if (isLoading) {
         return (
             <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <div className="flex flex-col items-center w-full max-w-xl text-center">
                    <Loader2 className="h-12 w-12 text-primary-500 animate-spin mb-4" />
                    <p className="text-lg font-semibold text-slate-700">{progress?.status || 'Processing...'}</p>
                    <p className="text-sm text-slate-500 mt-1">This can take a moment for large files.</p>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4">
                        <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress?.percentage || 0}%`, transition: 'width 0.5s ease-in-out' }}></div>
                    </div>
                </div>
             </div>
        );
    }
    
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 duration-300">
             <div className="w-full max-w-md text-center">
                 <div className="p-4 bg-primary-100 text-primary-600 rounded-full mb-6 inline-block">
                    <FolderPlus size={40} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Create Your First Project</h1>
                <p className="text-slate-500 mt-2 mb-8">
                    Start by creating and naming a new project to keep your data, dashboards, and reports organized.
                </p>
                <button 
                    onClick={onCreateProject}
                    className="w-full max-w-xs mx-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center"
                >
                    <FolderPlus size={16} className="mr-2" />
                    Create a Project
                </button>
             </div>
            {error && (
                <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start max-w-md text-red-700 w-full">
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};