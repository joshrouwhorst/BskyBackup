'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { AppData } from '@/types/types'

interface AppDataContextType {
  appData: AppData
  refresh: () => Promise<void>
  isLoading: boolean
}

// Create the context
const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

interface AppDataProviderProps {
  children: ReactNode
}

export default function AppDataProvider({ children }: AppDataProviderProps) {
  const [appData, setAppData] = useState<AppData>({ lastBackup: null })
  const [isLoading, setIsLoading] = useState(false)

  const refresh = async () => {
    setIsLoading(true)
    // Fetch app data from an API endpoint or other source
    const response = await fetch('/api/app-data')
    if (response.ok) {
      const data: AppData = await response.json()
      setAppData(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const contextValue: AppDataContextType = {
    appData,
    refresh,
    isLoading,
  }

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  )
}

export const useAppDataContext = () => {
  const context = useContext(AppDataContext)
  if (context === undefined) {
    throw new Error('useAppDataContext must be used within an AppDataProvider')
  }
  return context
}
