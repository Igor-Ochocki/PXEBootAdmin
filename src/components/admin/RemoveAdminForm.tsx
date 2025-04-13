import { useState, useEffect } from 'react';
import AdminModal from './AdminModal';

interface Admin {
  id: number;
  userId: string;
}

interface RemoveAdminFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userId: string) => void;
}

export default function RemoveAdminForm({ isOpen, onClose, onSubmit }: RemoveAdminFormProps) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await fetch('/api/admin/admins');
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setAdmins(data);
          if (data.length > 0) {
            setSelectedAdmin(data[0].userId);
          }
        }
      } catch (error) {
        console.error('Error fetching admins:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchAdmins();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = admins.find(a => a.userId === selectedAdmin);
    if (admin) {
      onSubmit(admin.userId);
      onClose();
    }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Remove Admin">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="admin" className="block text-quinary text-sm font-medium mb-1">
            Select Admin to Remove
          </label>
          <select
            id="admin"
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
            className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary"
            required
            disabled={isLoading}
          >
            {isLoading ? (
              <option value="">Loading...</option>
            ) : (
              admins.map((admin) => (
                <option key={admin.id} value={admin.userId}>
                  {admin.userId}
                </option>
              ))
            )}
          </select>
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
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            disabled={isLoading}
          >
            Remove Admin
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
