import { useState, useEffect } from 'react';
import AdminModal from './AdminModal';

interface OperatingSystem {
  id: number;
  code: string;
  name: string;
}

interface RemoveOperatingSystemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number) => void;
}

export default function RemoveOperatingSystemForm({ isOpen, onClose, onSubmit }: RemoveOperatingSystemFormProps) {
  const [operatingSystems, setOperatingSystems] = useState<OperatingSystem[]>([]);
  const [selectedOS, setSelectedOS] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOperatingSystems = async () => {
      try {
        const response = await fetch('/api/operating-system');
        if (response.ok) {
          const data = await response.json();
          setOperatingSystems(data);
          if (data.length > 0) {
            setSelectedOS(data[0].code);
          }
        }
      } catch (error) {
        console.error('Error fetching operating systems:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchOperatingSystems();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const os = operatingSystems.find(os => os.code === selectedOS);
    if (os) {
      onSubmit(os.id);
      onClose();
    }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Remove Operating System">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="os" className="block text-quinary text-sm font-medium mb-1">
            Select Operating System to Remove
          </label>
          <select
            id="os"
            value={selectedOS}
            onChange={(e) => setSelectedOS(e.target.value)}
            className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary"
            required
            disabled={isLoading}
          >
            {isLoading ? (
              <option key={-1} value="">Loading...</option>
            ) : (
              operatingSystems.map((os) => (
                <option key={os.id} value={os.code}>
                  {os.name} ({os.code})
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
            Remove Operating System
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
