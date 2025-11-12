import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
}

export const DeleteConfirmationModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, projectName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm duration-200" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-md duration-200 relative" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
            <div className="flex items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 id="delete-modal-title" className="text-lg leading-6 font-medium text-slate-900">
                        Delete Project
                    </h3>
                    <div className="mt-2">
                        <p className="text-sm text-slate-500">
                            Are you sure you want to delete "<strong>{projectName}</strong>"? This action cannot be undone.
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl">
            <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => { onConfirm(); onClose(); }}
            >
                Confirm Delete
            </button>
            <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={onClose}
            >
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};