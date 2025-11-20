
import React from 'react';
import { UploadCloud, Edit3 } from 'lucide-react';
import { FileUploadContainer } from '../../../components/FileUploadContainer.tsx';
import { Project } from '../../../types.ts';
import { Button } from '../../../components/ui/index.ts';

interface Props {
    project: Project;
    onFileSelect: (file: File) => void;
    onRename: () => void;
}

export const ProjectEmptyState: React.FC<Props> = ({ project, onFileSelect, onRename }) => (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center gap-4 mb-6">
            <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-slate-900 truncate">{project.name}</h2>
                <p className="text-sm text-slate-500 truncate">{project.description || "No description provided."}</p>
            </div>
            <div className="flex-shrink-0">
                <Button onClick={onRename} variant="outline" size="sm" icon={Edit3} aria-label="Edit Project" />
            </div>
        </div>
        <div className="p-12 bg-white rounded-2xl border-2 border-dashed border-slate-300 text-center flex flex-col items-center">
            <div className="p-4 bg-primary-100 text-primary-600 rounded-full mb-4">
                <UploadCloud size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Add a Data Source</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                To get started, please upload the data file for your project "{project.name}".
            </p>
            <div className="w-full max-w-lg">
                <FileUploadContainer onFileSelect={onFileSelect} />
            </div>
        </div>
    </div>
);
