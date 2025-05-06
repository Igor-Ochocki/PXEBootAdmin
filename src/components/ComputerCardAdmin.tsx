'use client'

import { Suspense, useEffect, useState } from 'react'
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/react"
import ComputerStateInfo from "./computerCardInfo/ComputerStateInfo"
import Modal from "./scheduleForm/Modal"
import PowerControlForm from './PowerControlForm'
import OperatingSystemInfo from './computerCard/operatingSystem/OperatingSystemInfo'
import { useComputerState } from '@/hooks/useComputerState'
import { ComputerStateBackgroundColors } from './computerCardInfo/ComputerState'

export default function ComputerCardAdmin({ stationId }: { stationId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { state, isLoading } = useComputerState(stationId)
  const [stateColor, setStateColor] = useState<string>("")

  useEffect(() => {
    if(!isLoading) {
      setStateColor(ComputerStateBackgroundColors[state?.status as keyof typeof ComputerStateBackgroundColors])
    }
  }, [isLoading, state])

  const handleCardClick = () => {
    setIsModalOpen(true)
    setSubmitError(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSubmitError(null)
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
        </div>
      </Modal>
    </>
  )
}
