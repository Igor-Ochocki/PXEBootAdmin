import { useState } from 'react';
import AdminModal from './AdminModal';

interface AddOperatingSystemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, code: string) => void;
}

export default function AddOperatingSystemForm({ isOpen, onClose, onSubmit }: AddOperatingSystemFormProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name, code);
    setName('');
    setCode('');
    onClose();
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Add Operating System">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-quinary text-sm font-medium mb-1">
            Operating System Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary"
            required
          />
        </div>
        <div>
          <label htmlFor="code" className="block text-quinary text-sm font-medium mb-1">
            System Code
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary"
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-quinary hover:text-quaternary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-quaternary text-primary rounded-md hover:bg-quaternary/80 transition-colors"
          >
            Add Operating System
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
