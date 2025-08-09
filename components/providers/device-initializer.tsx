'use client'

import { useEffect } from 'react'
import { useDeviceStore } from '@/store/device-store'

export function DeviceInitializer() {
  const initializeDevice = useDeviceStore(state => state.initializeDevice)
  
  useEffect(() => {
    initializeDevice()
  }, [initializeDevice])
  
  return null
}
