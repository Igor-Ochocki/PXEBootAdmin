'use client'

import React from 'react'
import { ComputerStateColors, ComputerState } from './ComputerState'
import CircleIcon from '@mui/icons-material/Circle'
export default function ComputerStateInfo({ state }: { state: ComputerState }) {

  const stateColor = ComputerStateColors[state]

  return (
    <div className={`flex justify-center items-center w-full h-full ${stateColor} gap-2`}>
      <CircleIcon style={{ fontSize: 'small' }} />
      <p>{state}</p>
    </div>
  )
}
