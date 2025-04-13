import { useState, useEffect } from 'react';
import AdminModal from './AdminModal';

interface OperatingSystem {
  id: number;
  code: string;
  name: string;
}

interface AddSubsystemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, code: string, operatingSystemId: number) => void;
}

export default function AddSubsystemForm({ isOpen, onClose, onSubmit }: AddSubsystemFormProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [operatingSystems, setOperatingSystems] = useState<OperatingSystem[]>([]);
  const [selectedOS, setSelectedOS] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOperatingSystems = async () => {
      try {
        const response = await fetch('/api/operating-system');
        if (response.ok) {
          const data = await response.json();
          setOperatingSystems(data);
          if (data.length > 0) {
            setSelectedOS(data[0].id);
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
    const os = operatingSystems.find(os => os.id === selectedOS);
    if (os) {
      onSubmit(name, code, os.id);
      setName('');
      setCode('');
      onClose();
    }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Add Subsystem">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="os" className="block text-quinary text-sm font-medium mb-1">
            Operating System
          </label>
          <select
            id="os"
            value={selectedOS}
            onChange={(e) => setSelectedOS(parseInt(e.target.value))}
            className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary"
            required
            disabled={isLoading}
          >
            {isLoading ? (
              <option value="">Loading...</option>
            ) : (
              operatingSystems.map((os) => (
                <option key={os.id} value={os.id}>
                  {os.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label htmlFor="name" className="block text-quinary text-sm font-medium mb-1">
            Subsystem Name
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
            disabled={isLoading}
          >
            Add Subsystem
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
