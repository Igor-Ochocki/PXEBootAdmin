import { useState, useEffect } from 'react';
import AdminModal from './AdminModal';

interface OperatingSystem {
  id: number;
  code: string;
  name: string;
}

interface Subsystem {
  id: number;
  code: string;
  name: string;
}

interface RemoveSubsystemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number) => void;
}

export default function RemoveSubsystemForm({ isOpen, onClose, onSubmit }: RemoveSubsystemFormProps) {
  const [operatingSystems, setOperatingSystems] = useState<OperatingSystem[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [selectedOS, setSelectedOS] = useState<number>(0);
  const [selectedSubsystem, setSelectedSubsystem] = useState('');
  const [isLoadingOS, setIsLoadingOS] = useState(true);
  const [isLoadingSubsystems, setIsLoadingSubsystems] = useState(false);

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
        setIsLoadingOS(false);
      }
    };

    if (isOpen) {
      fetchOperatingSystems();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchSubsystems = async () => {
      if (!selectedOS) return;

      setIsLoadingSubsystems(true);
      try {
        const selectedOSCode = operatingSystems.find(os => os.id === selectedOS)?.code;
        if (!selectedOSCode) return;
        const response = await fetch(`/api/operating-system/subsystems?os=${selectedOSCode}`);
        if (response.ok) {
          const data = await response.json();
          setSubsystems(data);
          if (data.length > 0) {
            setSelectedSubsystem(data[0].code);
          } else {
            setSelectedSubsystem('');
          }
        }
      } catch (error) {
        console.error('Error fetching subsystems:', error);
      } finally {
        setIsLoadingSubsystems(false);
      }
    };

    if (selectedOS) {
      fetchSubsystems();
    }
  }, [selectedOS, operatingSystems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subsystem = subsystems.find(s => s.code === selectedSubsystem);
    if (subsystem) {
      onSubmit(subsystem.id);
      onClose();
    }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Remove Subsystem">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="os" className="block text-quinary text-sm font-medium mb-1">
            Select Operating System
          </label>
          <select
            id="os"
            value={selectedOS}
            onChange={(e) => setSelectedOS(parseInt(e.target.value))}
            className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary"
            required
            disabled={isLoadingOS}
          >
            {isLoadingOS ? (
              <option value="">Loading operating systems...</option>
            ) : (
              operatingSystems.map((os) => (
                <option key={os.id} value={os.id}>
                  {os.name} ({os.code})
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label htmlFor="subsystem" className="block text-quinary text-sm font-medium mb-1">
            Select Subsystem to Remove
          </label>
          <select
            id="subsystem"
            value={selectedSubsystem}
            onChange={(e) => setSelectedSubsystem(e.target.value)}
            className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary"
            required
            disabled={isLoadingSubsystems || !selectedOS || subsystems.length === 0}
          >
            {isLoadingSubsystems ? (
              <option value="">Loading subsystems...</option>
            ) : subsystems.length === 0 ? (
              <option value="">No subsystems available</option>
            ) : (
              subsystems.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.name} ({s.code})
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
            disabled={isLoadingOS || isLoadingSubsystems || !selectedSubsystem}
          >
            Remove Subsystem
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
