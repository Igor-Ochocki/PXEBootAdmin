'use client'

import { useState } from 'react'
import { Button } from "@heroui/react"
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to logout')
      }

      // Redirect to login page
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      onPress={handleLogout}
      disabled={isLoading}
      className="text-quinary border border-quaternary rounded-full px-4 py-2
                transition-all duration-300 ease-in-out
                hover:bg-red-500 hover:text-white hover:border-red-500
                active:bg-red-700 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  )
}
