'use client'

import { Suspense, useEffect, useState } from 'react'
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/react"
import ComputerStateInfo from "./computerCardInfo/ComputerStateInfo"
import Modal from "./scheduleForm/Modal"
import ScheduleForm, { ScheduleFormData } from "./scheduleForm/ScheduleForm"
import OperatingSystemInfo from './computerCard/operatingSystem/OperatingSystemInfo'
import { useComputerState } from '@/hooks/useComputerState';
import { ComputerStateBackgroundColors } from './computerCardInfo/ComputerState';

export default function ComputerCard({ stationId }: { stationId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stateColor, setStateColor] = useState<string>("")

  const { state, isLoading } = useComputerState(stationId)

  useEffect(() => {
    if(!isLoading) {
      setStateColor(ComputerStateBackgroundColors[state?.status as keyof typeof ComputerStateBackgroundColors])
    }
  }, [isLoading, state])

  const handleCardClick = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setIsModalOpen(false)
  }

  const handleScheduleSubmit = async (formData: ScheduleFormData) => {
    try {
      setIsSubmitting(true)

      // Send the data to the API endpoint
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit schedule')
      }

      console.log('Schedule submitted successfully:', result)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error submitting schedule:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        className="w-full h-[30vh] max-w-[30vw] md:max-w-[22vw] lg:max-w-[15vw] flex items-center justify-center group cursor-pointer"
        onClick={handleCardClick}
      >
        <Card className={`w-[90%] h-full border-quaternary border-2 rounded-xl
                        hover:bg-tertiary-transparent transition-all duration-300 ease-in-out transform group-hover:scale-110 ${stateColor !== "" ? stateColor : "bg-transparent"}`}>
          <CardHeader className="p-2 flex items-center justify-center">
              <p className="text-quinary font-medium text-lg text-outline">s{stationId}</p>
          </CardHeader>
          <CardBody className="h-full flex items-center justify-center">
            <OperatingSystemInfo stationId={stationId} />
          </CardBody>
          <CardFooter className="flex items-center justify-center">
            <Suspense fallback={<div>Loading...</div>}>
              <ComputerStateInfo isLoading={isLoading} state={state} />
            </Suspense>
          </CardFooter>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="w-full flex justify-center">
          <ScheduleForm
            stationId={stationId}
            onSubmit={handleScheduleSubmit}
            onCancel={isSubmitting ? undefined : handleCloseModal}
          />
          {/* <PowerControlForm
            stationId={stationId}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          /> */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
              <div className="animate-pulse text-quaternary font-bold">Submitting...</div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
