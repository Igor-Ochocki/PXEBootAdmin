import { CardBody } from "@heroui/react";
import { useEffect, useRef, useState } from 'react';

interface OperatingSystem {
  id: number;
  code: string;
  name: string;
}

interface SubSystem {
  id: number;
  code: string;
  name: string;
}

interface OperatingSystemFormProps {
  operatingSystems: OperatingSystem[];
  selectedOS: string;
  onSelectChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (os: string, subSystem: string) => void;
}

export default function OperatingSystemForm({
  operatingSystems,
  selectedOS,
  onSelectChange,
  onClose,
  onSubmit,
}: OperatingSystemFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const [subSystems, setSubSystems] = useState<SubSystem[]>([]);
  const [selectedSubSystem, setSelectedSubSystem] = useState<string>('');
  const [isLoadingSubSystems, setIsLoadingSubSystems] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    // Focus the select element when the form opens
    if (selectRef.current) {
      selectRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    const fetchSubSystems = async () => {
      if (!selectedOS) {
        setSubSystems([]);
        setSelectedSubSystem('');
        return;
      }

      setIsLoadingSubSystems(true);
      try {
        const response = await fetch(`/api/operating-system/${selectedOS}/subsystems`);
        if (response.ok) {
          const data = await response.json();
          setSubSystems(data);
          setSelectedSubSystem(data[0]?.code || '');
        }
      } catch (error) {
        console.error('Error fetching subsystems:', error);
      } finally {
        setIsLoadingSubSystems(false);
      }
    };

    fetchSubSystems();
  }, [selectedOS]);

  const handleSubmit = () => {
    onSubmit(selectedOS, selectedSubSystem);
  };

  return (
    <div
      ref={formRef}
      className="animate-fade-in bg-primary border-quaternary rounded-lg shadow-lg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="operatingSystemLabel"
      onClick={(e) => e.stopPropagation()}
    >
      <CardBody className="p-4">
        <div className="space-y-4">
          <div>
            <label
              id="operatingSystemLabel"
              htmlFor="operatingSystem"
              className="block text-quinary text-sm font-medium mb-1"
            >
              Operating System
            </label>
            <select
              ref={selectRef}
              id="operatingSystem"
              value={selectedOS}
              onChange={(e) => onSelectChange(e.target.value)}
              className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary focus:outline-none focus:ring-2 focus:ring-quaternary"
              aria-label="Select operating system"
            >
              {operatingSystems.map((os) => (
                <option key={os.id} value={os.code}>
                  {os.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              id="subSystemLabel"
              htmlFor="subSystem"
              className="block text-quinary text-sm font-medium mb-1"
            >
              Subsystem
            </label>
            <select
              id="subSystem"
              value={selectedSubSystem}
              onChange={(e) => setSelectedSubSystem(e.target.value)}
              disabled={isLoadingSubSystems || !selectedOS}
              className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary focus:outline-none focus:ring-2 focus:ring-quaternary disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Select subsystem"
            >
              {isLoadingSubSystems ? (
                <option value="">Loading subsystems...</option>
              ) : subSystems.length > 0 ? (
                subSystems.map((sub) => (
                  <option key={sub.id} value={sub.code}>
                    {sub.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>No subsystems available</option>
              )}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-quinary hover:text-quaternary transition-colors focus:outline-none focus:ring-2 focus:ring-quaternary rounded-md"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedOS || !selectedSubSystem || isLoadingSubSystems}
              className="px-4 py-2 bg-quaternary text-primary rounded-md hover:bg-quaternary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-quaternary disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save changes"
            >
              Save
            </button>
          </div>
        </div>
      </CardBody>
    </div>
  );
}
