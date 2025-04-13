import { useState } from 'react';
import AdminModal from './AdminModal';

interface AddAdminFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string) => void;
}

export default function AddAdminForm({ isOpen, onClose, onSubmit }: AddAdminFormProps) {
  const [id, setId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(id);
    setId('');
    onClose();
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Add Admin">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="id" className="block text-quinary text-sm font-medium mb-1">
            Admin ID
          </label>
          <input
            type="text"
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
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
            Add Admin
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
