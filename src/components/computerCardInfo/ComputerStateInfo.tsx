'use client'

import React from 'react'
import { ComputerStateColors } from './ComputerState'
import CircleIcon from '@mui/icons-material/Circle'
import { StationData } from '@/utils/getStationsData'

export default function ComputerStateInfo({ isLoading, state }: { isLoading: boolean, state: StationData | null }) {

  const stateColor = ComputerStateColors[state?.status as keyof typeof ComputerStateColors]

  return (
    <div className={`flex justify-center items-center w-full h-full ${stateColor} text-outline gap-2`}>
      <CircleIcon className="rounded-full border border-white" style={{ fontSize: 'small' }} />
      {isLoading ? <p>Loading...</p> : state ? <p>{state.status}</p> : <p>Error</p>}
    </div>
  )
}
