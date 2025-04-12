import { useState, useEffect } from 'react';
import { getMachineOperatingSystem } from '@/utils/getMachineOperatingSystem';
import { createPortal } from 'react-dom';
import OperatingSystemForm from './OperatingSystemForm';

interface OperatingSystem {
  id: number;
  code: string;
  name: string;
}

export default function OperatingSystemInfo({ stationId }: { stationId: string }) {
  const [operatingSystem, setOperatingSystem] = useState<string>('');
  const [subSystem, setSubSystem] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [operatingSystems, setOperatingSystems] = useState<OperatingSystem[]>([]);
  const [selectedOS, setSelectedOS] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const fetchOperatingSystem = async () => {
      const os = await getMachineOperatingSystem(stationId);
      setOperatingSystem(os);
      setIsLoading(false);
    };

    const fetchOperatingSystems = async () => {
      try {
        const response = await fetch('/api/operating-system');
        if (response.ok) {
          const data = await response.json();
          setOperatingSystems(data);
        }
      } catch (error) {
        console.error('Error fetching operating systems:', error);
      }
    };

    fetchOperatingSystem();
    fetchOperatingSystems();
  }, [stationId]);

  useEffect(() => {
    if (isEditing) {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      container.style.opacity = '0';
      container.style.transition = 'opacity 0.2s ease-in-out';

      // Add click handler to prevent event propagation
      container.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      document.body.appendChild(container);

      // Trigger reflow
      void container.offsetHeight;
      container.style.opacity = '1';

      setPortalContainer(container);

      return () => {
        container.removeEventListener('click', (e) => {
          e.stopPropagation();
        });
        container.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(container);
        }, 200);
      };
    }
  }, [isEditing]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setSelectedOS(operatingSystem);
  };

  const handleClose = () => {
    setIsEditing(false);
    setSelectedOS(operatingSystem);
  };

  const handleSubmit = async (os: string, subSystem: string) => {
    try {
      const response = await fetch('/api/operating-system', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stationId,
          operatingSystem: os,
          subSystem,
        }),
      });

      if (response.ok) {
        setOperatingSystem(os);
        setSubSystem(subSystem);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating operating system:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-quinary font-medium">{operatingSystem}</h1>
          {subSystem && (
            <p className="text-quinary/80 text-sm">{subSystem}</p>
          )}
        </div>
        <button
          onClick={handleEdit}
          className="p-1 text-quinary hover:text-quaternary transition-colors focus:outline-none focus:ring-2 focus:ring-quaternary rounded-md"
          title="Edit operating system"
          aria-label="Edit operating system"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      </div>

      {isEditing && portalContainer && createPortal(
        <OperatingSystemForm
          operatingSystems={operatingSystems}
          selectedOS={selectedOS}
          onSelectChange={setSelectedOS}
          onClose={handleClose}
          onSubmit={handleSubmit}
        />,
        portalContainer
      )}
    </>
  );
}
