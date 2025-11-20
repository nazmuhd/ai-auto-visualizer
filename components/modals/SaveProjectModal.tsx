
import React, { useState, useEffect } from 'react';
import { Save, FileText, Type } from 'lucide-react';
import { Button, Input, Modal } from '../ui/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  defaultName: string;
}

export const SaveProjectModal: React.FC<Props> = ({ isOpen, onClose, onSave, defaultName }) => {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Clean up file extension for a better default name
      const cleanedName = defaultName.replace(/\.(csv|xls|xlsx)$/i, '');
      setName(cleanedName);
      setDescription(''); // Reset description on open
    }
  }, [isOpen, defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      onSave(name, description);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Project"
      size="md"
    >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Project Name"
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={FileText}
            required
          />

           <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-slate-700 mb-1.5">Description (Optional)</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none">
                    <Type className="h-5 w-5 text-slate-400" />
                </div>
                <textarea
                    id="project-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a brief description of your project..."
                    className="w-full pl-10 pr-3 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none transition-all"
                />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" icon={Save}>Save</Button>
          </div>
        </form>
    </Modal>
  );
};
