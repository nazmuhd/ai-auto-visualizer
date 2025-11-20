
import React, { useState, useEffect } from 'react';
import { Save, FileText, Type } from 'lucide-react';
import { Button, Input, Modal } from '../ui/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  currentName: string;
  currentDescription: string;
}

export const RenameProjectModal: React.FC<Props> = ({ isOpen, onClose, onSave, currentName, currentDescription }) => {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setDescription(currentDescription);
    }
  }, [isOpen, currentName, currentDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      onSave(name, description);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Project"
      size="md"
    >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Project Name"
            id="project-rename"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={FileText}
            required
            autoFocus
          />
          
          <div>
            <label htmlFor="project-description-edit" className="block text-sm font-medium text-slate-700 mb-1.5">Description (Optional)</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none">
                    <Type className="h-5 w-5 text-slate-400" />
                </div>
                <textarea
                    id="project-description-edit"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a brief description of your project..."
                    className="w-full pl-10 pr-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none transition-all"
                />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
             <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
             <Button type="submit" icon={Save}>Save Changes</Button>
          </div>
        </form>
    </Modal>
  );
};
