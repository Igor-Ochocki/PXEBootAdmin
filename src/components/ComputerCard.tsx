'use client'

import { Suspense, useState } from 'react'
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/react"
import ComputerStateInfo from "./computerCardInfo/ComputerStateInfo"
import Modal from "./scheduleForm/Modal"
// import ScheduleForm, { ScheduleFormData } from "./scheduleForm/ScheduleForm"
import PowerControlForm from './PowerControlForm'

export default function ComputerCard({ stationId }: { stationId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  // const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleCardClick = () => {
    setIsModalOpen(true)
    setSubmitError(null)
  }

  const handleCloseModal = () => {
    // if (isSubmitting) return; // Prevent closing while submitting
    setIsModalOpen(false)
    setSubmitError(null)
  }

  // const handleScheduleSubmit = async (formData: ScheduleFormData) => {
  //   try {
  //     setIsSubmitting(true)
  //     setSubmitError(null)

  //     // Send the data to the API endpoint
  //     const response = await fetch('/api/schedule', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         ...formData
  //       }),
  //     })

  //     const result = await response.json()

  //     if (!response.ok || !result.success) {
  //       throw new Error(result.message || 'Failed to submit schedule')
  //     }

  //     console.log('Schedule submitted successfully:', result)
  //     setIsModalOpen(false)
  //   } catch (error) {
  //     console.error('Error submitting schedule:', error)
  //     setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred')
  //   } finally {
  //     setIsSubmitting(false)
  //   }
  // }

  return (
    <>
      <div
        className="w-full h-full flex items-center justify-center group cursor-pointer"
        onClick={handleCardClick}
      >
        <Card className="w-[50%] h-full border-quaternary border-2 rounded-xl
                        hover:bg-tertiary-transparent transition-all duration-300 ease-in-out transform group-hover:scale-110">
          <CardHeader className="p-2 flex items-center justify-center">
              <p className="text-quinary font-medium text-lg">s{stationId}</p>
          </CardHeader>
          <CardBody className="h-full flex items-center justify-center">
          </CardBody>
          <CardFooter className="flex items-center justify-center">
            <Suspense fallback={<div>Loading...</div>}>
              <ComputerStateInfo stationId={stationId} />
            </Suspense>
          </CardFooter>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="w-full max-w-md">
          {submitError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-500">
              {submitError}
            </div>
          )}
          <PowerControlForm
            stationId={stationId}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
          {/* {isSubmitting && (
            <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
              <div className="animate-pulse text-quaternary font-bold">Submitting...</div>
            </div>
          )} */}
        </div>
      </Modal>
    </>
  )
}
