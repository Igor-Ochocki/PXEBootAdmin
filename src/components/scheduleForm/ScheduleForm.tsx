'use client'

import { useState } from 'react'
import { Card, CardBody, CardFooter, CardHeader, Button, Input } from "@heroui/react"

interface ScheduleFormProps {
  onSubmit: (formData: ScheduleFormData) => void
  onCancel?: () => void
  stationId: string
}

export interface ScheduleFormData {
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  operatingSystem: string
}

export default function ScheduleForm({ onSubmit, onCancel, stationId }: ScheduleFormProps) {
  const [formData, setFormData] = useState<ScheduleFormData>({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    operatingSystem: '',
  })

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
    <Card className="w-full max-w-md mx-auto border-quaternary border-2 rounded-xl">
      <CardHeader className="bg-primary p-4 rounded-t-xl">
        <h2 className="text-quinary text-xl font-bold">Schedule station {stationId} time</h2>
      </CardHeader>

      <form onSubmit={handleSubmit} className="bg-secondary-transparent">
        <CardBody className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-quinary text-sm font-medium mb-1">
                Start Date
              </label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="endDate" className="block text-quinary text-sm font-medium mb-1">
                End Date
              </label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="endTime" className="block text-quinary text-sm font-medium mb-1">
                End Time
              </label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>
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
              <option value="linux-ubuntu">Linux Ubuntu</option>
              <option value="linux-arch">Linux Arch</option>
            </select>
          </div>
        </CardBody>

        <CardFooter className="p-4 flex justify-end space-x-2">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
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
            className="text-green-500 border border-quaternary rounded-full px-4 py-2
                      transition-all duration-300 ease-in-out
                      hover:bg-green-500 hover:text-white hover:border-green-500
                      active:bg-green-700 active:scale-95"
          >
            Schedule
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
