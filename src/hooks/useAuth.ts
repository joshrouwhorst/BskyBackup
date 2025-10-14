import { useState, useEffect, useCallback } from 'react'

interface AuthStatus {
  isAuthenticated: boolean
  loading: boolean
  user?: {
    handle: string
    name?: string
  }
}

export function useAuth() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    loading: true,
  })

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/status')
      if (response.ok) {
        const data = await response.json()
        setAuthStatus({
          isAuthenticated: data.authenticated,
          loading: false,
          user: data.user,
        })
      } else {
        setAuthStatus({ isAuthenticated: false, loading: false })
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setAuthStatus({ isAuthenticated: false, loading: false })
    }
  }, [])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      setAuthStatus({ isAuthenticated: false, loading: false })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return {
    ...authStatus,
    checkAuthStatus,
    signOut,
  }
}
