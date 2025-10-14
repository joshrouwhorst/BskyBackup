'use client'

import { useState, useEffect } from 'react'

interface AuthStatus {
  isAuthenticated: boolean
  loading: boolean
  user?: {
    handle: string
    name?: string
  }
}

export default function SignInForm() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    loading: true,
  })
  const [handle, setHandle] = useState('')

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status')
        if (response.ok) {
          const data = await response.json()
          setAuthStatus({
            isAuthenticated: data.authenticated,
            loading: false,
            user: data.user,
          })

          if (data.authenticated) {
            // User is already signed in, redirect
            const params = new URLSearchParams(window.location.search)
            const redirect = params.get('redirect') || '/'
            window.location.href = redirect
          }
        } else {
          setAuthStatus({ isAuthenticated: false, loading: false })
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
        setAuthStatus({ isAuthenticated: false, loading: false })
      }
    }

    // Check authentication status on component mount
    checkAuthStatus()
  }, [])

  const handleSignIn = async () => {
    if (!handle.trim()) {
      alert('Please enter your Bluesky handle')
      return
    }

    // Redirect to OAuth authorization
    const authUrl = `/api/oauth/authorize?handle=${encodeURIComponent(handle)}`
    window.location.href = authUrl
  }

  if (authStatus.loading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Checking authentication...</p>
      </div>
    )
  }

  if (authStatus.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold text-green-600">
          Already Signed In
        </h2>
        <p className="mt-2 text-gray-600">
          Welcome back, {authStatus.user?.handle}!
        </p>
        <p className="text-sm text-gray-500">Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold text-center mb-6">
        Sign In to BskyBackup
      </h1>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="handle"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Bluesky Handle
          </label>
          <input
            id="handle"
            type="text"
            placeholder="yourhandle.bsky.social"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
          />
        </div>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={!handle.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Sign in with Bluesky OAuth
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This will redirect you to Bluesky to authorize BskyBackup
        </p>
      </div>
    </div>
  )
}
