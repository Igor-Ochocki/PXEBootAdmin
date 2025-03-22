'use client'

import { useState } from 'react'
import { Button } from "@heroui/react"

export default function LoginButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/auth/request-token`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate login')
      }

      // Redirect to USOS authorization page
      window.location.href = `https://apps.usos.pw.edu.pl/services/oauth/authorize?oauth_token=${data.oauthToken}`;
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      onPress={handleLogin}
      disabled={isLoading}
      className="text-quinary border border-quaternary rounded-full px-4 py-2
                transition-all duration-300 ease-in-out
                hover:bg-primary hover:text-quinary hover:border-primary
                active:bg-primary/80 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Logging in...' : 'Login with USOS'}
    </Button>
  )
}
