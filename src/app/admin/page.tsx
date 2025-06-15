'use client';

import UserPhoto from "@/components/UserPhoto";
import LogoutButton from "@/components/LogoutButton";
import { ComputerStations } from "@/constants/ComputerStations";
import { DecToHex } from "@/utils/DecToHex";
import ComputerCardAdmin from "@/components/ComputerCardAdmin";
import { useState } from "react";
import AddAdminForm from '@/components/admin/AddAdminForm';
import AddOperatingSystemForm from '@/components/admin/AddOperatingSystemForm';
import AddSubsystemForm from '@/components/admin/AddSubsystemForm';
import RemoveOperatingSystemForm from '@/components/admin/RemoveOperatingSystemForm';
import RemoveSubsystemForm from '@/components/admin/RemoveSubsystemForm';
import RemoveAdminForm from '@/components/admin/RemoveAdminForm';
import {
  PersonAdd,
  PersonRemove,
  NoteAdd,
  NoteAlt,
  CreateNewFolder,
  FolderDelete,
  Menu,
  Close,
  Refresh,
  Computer
} from '@mui/icons-material';
import SetMachineOSForm from "@/components/admin/SetMachineOSForm";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleAddAdmin = async (id: string) => {
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id }),
      });
      if (!response.ok) throw new Error('Failed to add admin');
      // Handle success
    } catch (error) {
      console.error('Error adding admin:', error);
    }
  };

  const handleAddOperatingSystem = async (name: string, code: string) => {
    try {
      const response = await fetch('/api/admin/operating-system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code }),
      });
      if (!response.ok) throw new Error('Failed to add operating system');
      // Handle success
    } catch (error) {
      console.error('Error adding operating system:', error);
    }
  };

  const handleAddSubsystem = async (name: string, code: string, operatingSystemId: number) => {
    try {
      const response = await fetch('/api/admin/operating-system/subsystem', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, operatingSystemId }),
      });
      if (!response.ok) throw new Error('Failed to add subsystem');
      // Handle success
    } catch (error) {
      console.error('Error adding subsystem:', error);
    }
  };

  const handleRemoveOperatingSystem = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/operating-system?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove operating system');
      // Handle success
    } catch (error) {
      console.error('Error removing operating system:', error);
    }
  };

  const handleRemoveSubsystem = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/operating-system/subsystem?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove subsystem');
      // Handle success
    } catch (error) {
      console.error('Error removing subsystem:', error);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/admins?userId=${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove admin');
      // Handle success
    } catch (error) {
      console.error('Error removing admin:', error);
    }
  };

  const handleSyncSchedules = async () => {
    try {
      const response = await fetch('/api/admin/schedules', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to sync schedules');
      // Handle success
    } catch (error) {
      console.error('Error syncing schedules:', error);
    }
  };

  const handleSetMachineOS = async (host: string, operatingSystemCode: string, subsystemCode: string, type: string) => {
    try {
      const response = await fetch('/api/operating-system', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stationId: host,
          operatingSystem: operatingSystemCode,
          subSystem: subsystemCode,
          type: type
        })
      });
      if (!response.ok) throw new Error('Failed to set machine OS');
      // Handle success
    } catch (error) {
      console.error('Error setting machine OS:', error);
    }
  };

  const closeModal = () => setActiveModal(null);

  return (
    <div className="flex flex-col h-screen">
      {/* Header Section */}
      <section className="p-4 flex items-center justify-between">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-lg hover:bg-secondary transition-colors duration-300"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6 text-quinary" />
        </button>
        <h1 className="text-quaternary text-center text-4xl font-bold">PXE Boot Admin (admin)</h1>
        <div className="flex items-center gap-4">
          <UserPhoto />
          <LogoutButton />
        </div>
      </section>

      {/* Side Menu */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-primary border-r border-quaternary transform transition-transform duration-300 ease-in-out z-50 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-quaternary text-xl font-bold">Menu</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors duration-300"
              aria-label="Close menu"
            >
              <Close className="h-5 w-5 text-quinary" />
            </button>
          </div>

          <nav className="flex-1">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    setActiveModal('addAdmin');
                  }}
                  className="w-full p-3 text-left text-quinary hover:bg-secondary rounded-lg transition-colors duration-300 flex items-center gap-2"
                >
                  <PersonAdd className="h-5 w-5" />
                  Add Admin
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveModal('removeAdmin');
                  }}
                  className="w-full p-3 text-left text-quinary hover:bg-secondary rounded-lg transition-colors duration-300 flex items-center gap-2"
                >
                  <PersonRemove className="h-5 w-5" />
                  Remove Admin
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveModal('addOS');
                  }}
                  className="w-full p-3 text-left text-quinary hover:bg-secondary rounded-lg transition-colors duration-300 flex items-center gap-2"
                >
                  <NoteAdd className="h-5 w-5" />
                  Add Operating System
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveModal('addSubsystem');
                  }}
                  className="w-full p-3 text-left text-quinary hover:bg-secondary rounded-lg transition-colors duration-300 flex items-center gap-2"
                >
                  <CreateNewFolder className="h-5 w-5" />
                  Add Operating Subsystem
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveModal('removeSubsystem');
                  }}
                  className="w-full p-3 text-left text-quinary hover:bg-secondary rounded-lg transition-colors duration-300 flex items-center gap-2"
                >
                  <FolderDelete className="h-5 w-5" />
                  Remove Operating Subsystem
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveModal('removeOS');
                  }}
                  className="w-full p-3 text-left text-quinary hover:bg-secondary rounded-lg transition-colors duration-300 flex items-center gap-2"
                >
                  <NoteAlt className="h-5 w-5" />
                  Remove Operating System
                </button>
              </li>
              <li>
                <button
                  onClick={handleSyncSchedules}
                  className="w-full p-3 text-left text-quinary hover:bg-secondary rounded-lg transition-colors duration-300 flex items-center gap-2"
                >
                  <Refresh className="h-5 w-5" />
                  Sync Schedules
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveModal('setMachineOS');
                  }}
                  className="w-full p-3 text-left text-quinary hover:bg-secondary rounded-lg transition-colors duration-300 flex items-center gap-2"
                >
                  <Computer className="h-5 w-5" />
                  Set Machine OS
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Section */}
      <section className="flex-grow p-4 overflow-auto no-scrollbar">
        <div className="h-full mx-[5%] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[2%]">
          {ComputerStations.map((station: number) => (
            <div
              key={station}
              className="flex justify-center"
            >
              <ComputerCardAdmin stationId={DecToHex(station)} />
            </div>
          ))}
        </div>
      </section>

      {/* Footer Section */}
      <section className="p-2 flex items-center justify-center">
        <p className="text-quinary">© 2025 PXE Boot Admin</p>
      </section>

      {/* Modals */}
      <AddAdminForm
        isOpen={activeModal === 'addAdmin'}
        onClose={closeModal}
        onSubmit={handleAddAdmin}
      />
      <AddOperatingSystemForm
        isOpen={activeModal === 'addOS'}
        onClose={closeModal}
        onSubmit={handleAddOperatingSystem}
      />
      <AddSubsystemForm
        isOpen={activeModal === 'addSubsystem'}
        onClose={closeModal}
        onSubmit={handleAddSubsystem}
      />
      <RemoveOperatingSystemForm
        isOpen={activeModal === 'removeOS'}
        onClose={closeModal}
        onSubmit={handleRemoveOperatingSystem}
      />
      <RemoveSubsystemForm
        isOpen={activeModal === 'removeSubsystem'}
        onClose={closeModal}
        onSubmit={handleRemoveSubsystem}
      />
      <RemoveAdminForm
        isOpen={activeModal === 'removeAdmin'}
        onClose={closeModal}
        onSubmit={handleRemoveAdmin}
      />
      <SetMachineOSForm
        isOpen={activeModal === 'setMachineOS'}
        onClose={closeModal}
        onSubmit={handleSetMachineOS}
      />
    </div>
  );
}
