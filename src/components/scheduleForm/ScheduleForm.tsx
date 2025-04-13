'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardFooter, CardHeader, Button, Input } from "@heroui/react"
import { ScheduleCalendar } from '@/components/calendar/ScheduleCalendar'

interface ScheduleFormProps {
  onSubmit: (formData: ScheduleFormData) => void
  onCancel?: () => void
  stationId: string
}

export interface ScheduleFormData {
  startDate: string
  startTime: string
  duration: string
  operatingSystem: string
  subSystem: string
  id: string
  stationId: string
}

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

export default function ScheduleForm({ onSubmit, onCancel, stationId }: ScheduleFormProps) {
  const [formData, setFormData] = useState<ScheduleFormData>({
    startDate: '',
    startTime: '',
    duration: '1:00', // Default 1 hour
    operatingSystem: '',
    subSystem: '',
    id: '',
    stationId: `s${stationId}`
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [operatingSystems, setOperatingSystems] = useState<OperatingSystem[]>([]);
  const [subSystems, setSubSystems] = useState<SubSystem[]>([]);
  const [isLoadingSubSystems, setIsLoadingSubSystems] = useState(false);

  // Generate duration options from 30 minutes to 6 hours
  const durationOptions = Array.from({ length: 12 }, (_, i) => {
    const hours = Math.floor((i + 1) * 30 / 60);
    const minutes = ((i + 1) * 30) % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  });

  // Calculate min and max dates
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user')
        if (response.ok) {
          const data = await response.json()
          setFormData(prev => ({ ...prev, id: data.id }))
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    const fetchOperatingSystems = async () => {
      try {
        const response = await fetch('/api/operating-system')
        if (response.ok) {
          const data = await response.json()
          setOperatingSystems(data)
        }
      } catch (error) {
        console.error('Error fetching operating systems:', error)
      }
    }

    fetchUserData()
    fetchOperatingSystems()
  }, [])

  useEffect(() => {
    const fetchSubSystems = async () => {
      if (!formData.operatingSystem) {
        setSubSystems([]);
        setFormData(prev => ({ ...prev, subSystem: '' }));
        return;
      }

      setIsLoadingSubSystems(true);
      try {
        const response = await fetch(`/api/operating-system/subsystems?os=${formData.operatingSystem}`);
        if (response.ok) {
          const data = await response.json();
          setSubSystems(data);
          setFormData(prev => ({ ...prev, subSystem: data[0]?.code || '' }));
        }
      } catch (error) {
        console.error('Error fetching subsystems:', error);
      } finally {
        setIsLoadingSubSystems(false);
      }
    };

    fetchSubSystems();
  }, [formData.operatingSystem]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="w-[75vw] md:w-[60vw] lg:w-[30vw] flex flex-col space-y-4 justify-center">
      <Card className="border-quaternary border-2 rounded-xl">
        <CardHeader className="bg-primary p-4 rounded-t-xl">
          <h2 className="text-quinary text-xl font-bold">Schedule station {stationId} time</h2>
        </CardHeader>

        <form onSubmit={handleSubmit} className="bg-secondary-transparent">
          <CardBody className="p-4 space-y-4">
            <div>
              <label htmlFor="startDate" className="block text-quinary text-sm font-medium mb-1">
                Date
              </label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                min={formatDateForInput(today)}
                max={formatDateForInput(maxDate)}
                required
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="startTime" className="block text-quinary text-sm font-medium mb-1">
                Start Time
              </label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-quinary text-sm font-medium mb-1">
                Duration
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary"
              >
                {durationOptions.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} hours
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="operatingSystem" className="block text-quinary text-sm font-medium mb-1">
                Operating System
              </label>
              <select
                id="operatingSystem"
                name="operatingSystem"
                value={formData.operatingSystem}
                onChange={handleChange}
                required
                className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary"
              >
                <option value="" disabled>Select an operating system</option>
                {operatingSystems.map((os) => (
                  <option key={os.id} value={os.code}>
                    {os.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subSystem" className="block text-quinary text-sm font-medium mb-1">
                Subsystem
              </label>
              <select
                id="subSystem"
                name="subSystem"
                value={formData.subSystem}
                onChange={handleChange}
                disabled={isLoadingSubSystems || !formData.operatingSystem}
                className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {operatingSystems.length > 0 && (
                  <>
                    <option value="ff" disabled>Select operating system</option>
                    <option value="">None</option>
                  </>
                )}
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
          </CardBody>

          <CardFooter className="p-4 flex justify-end space-x-2">
            {onCancel && (
              <Button
                type="button"
                onPress={onCancel}
                className="text-red-500 border border-quaternary rounded-full px-4 py-2
                          transition-all duration-300 ease-in-out
                          hover:bg-red-500 hover:text-white hover:border-red-500
                          active:bg-red-700 active:scale-95"
              >
                Exit
              </Button>
            )}
            <Button
              type="submit"
              disabled={!formData.operatingSystem || isLoadingSubSystems}
              className="text-green-500 border border-quaternary rounded-full px-4 py-2
                        transition-all duration-300 ease-in-out
                        hover:bg-green-500 hover:text-white hover:border-green-500
                        active:bg-green-700 active:scale-95
                        disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Schedule
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="w-full flex justify-center">
        <Button
          type="button"
          onPress={() => setShowCalendar(!showCalendar)}
          className={`border border-quaternary rounded-full px-4 py-2
                    transition-all duration-300 ease-in-out
                    hover:bg-blue-500 hover:text-white hover:border-blue-500
                    active:bg-blue-700 active:scale-95
                    ${showCalendar ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
        >
          {showCalendar ? 'Hide Schedule' : 'View Schedule'}
        </Button>
      </div>

      {showCalendar && (
        <ScheduleCalendar
          stationId={stationId}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  )
}
