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
  operatingSystemId: number;
}

interface SetMachineOSFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (host: string, operatingSystemCode: string, subsystemCode: string, type: string) => void;
}

export default function SetMachineOSForm({ isOpen, onClose, onSubmit }: SetMachineOSFormProps) {
  const [host, setHost] = useState('');
  const [type, setType] = useState('');
  const [operatingSystems, setOperatingSystems] = useState<OperatingSystem[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [selectedOS, setSelectedOS] = useState<string>('');
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('');
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

  useEffect(() => {
    const fetchSubsystems = async () => {
      if (selectedOS === '') return;

      try {
        const response = await fetch(`/api/operating-system/subsystems?os=${selectedOS}`);
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
      }
    };

    fetchSubsystems();
  }, [selectedOS]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(host, selectedOS, selectedSubsystem, type);
    setHost('');
    setType('');
    onClose();
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Set Machine OS">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="host" className="block text-quinary text-sm font-medium mb-1">
            Host
          </label>
          <input
            type="text"
            id="host"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary"
            required
          />
        </div>
        <div>
          <label htmlFor="os" className="block text-quinary text-sm font-medium mb-1">
            Operating System
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
              <option value="">Loading...</option>
            ) : (
              operatingSystems.map((os) => (
                <option key={os.id} value={os.code}>
                  {os.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label htmlFor="subsystem" className="block text-quinary text-sm font-medium mb-1">
            Subsystem
          </label>
          <select
            id="subsystem"
            value={selectedSubsystem}
            onChange={(e) => setSelectedSubsystem(e.target.value)}
            className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary"
            disabled={subsystems.length === 0}
          >
            {operatingSystems.length > 0 && (
                <option value="">None</option>
              )}
            {subsystems.length === 0 ? (
              <option value="">No subsystems available</option>
            ) : (
              subsystems.map((subsystem) => (
                <option key={subsystem.id} value={subsystem.code}>
                  {subsystem.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="block text-quinary text-sm font-medium mb-1">
            Type
          </label>
          <input
            type="text"
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary"
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
            disabled={isLoading || subsystems.length === 0}
          >
            Set OS
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
