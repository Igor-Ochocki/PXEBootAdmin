'use client'

import { Card, CardBody, CardFooter, CardHeader } from "@heroui/react"
import { ComputerState } from "./computerCardInfo/ComputerState"
import ComputerStateInfo from "./computerCardInfo/ComputerStateInfo"
import { DecToHex } from "@/utils/DecToHex"

export default function ComputerCard({ id }: { id: number }) {

  const stationId = DecToHex(id);

  return (
    <div className="w-full h-full flex items-center justify-center group">
      <Card className="w-[50%] h-full border-quaternary border-2 rounded-xl hover:bg-tertiary-transparent transition-all duration-300 ease-in-out transform group-hover:scale-110">
        <CardHeader className="p-2 flex items-center justify-center">
            <p className="text-quinary font-medium text-lg">s{stationId}</p>
        </CardHeader>
        <CardBody className="h-full flex items-center justify-center">
        </CardBody>
        <CardFooter className="flex items-center justify-center">
          <ComputerStateInfo state={ComputerState.OFF} />
        </CardFooter>
      </Card>
    </div>
  )
}