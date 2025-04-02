'use client'

import React from 'react'
import { ComputerStateColors } from './ComputerState'
import CircleIcon from '@mui/icons-material/Circle'
import { useComputerState } from '@/hooks/useComputerState';

export default function ComputerStateInfo({ stationId }: { stationId: string }) {

  const { state, isLoading } = useComputerState(stationId);

  const stateColor = ComputerStateColors[state?.status as keyof typeof ComputerStateColors]

  return (
    <div className={`flex justify-center items-center w-full h-full ${stateColor} gap-2`}>
      <CircleIcon style={{ fontSize: 'small' }} />
      {isLoading ? <p>Loading...</p> : state ? <p>{state.status}</p> : <p>Error</p>}
    </div>
  )
}
