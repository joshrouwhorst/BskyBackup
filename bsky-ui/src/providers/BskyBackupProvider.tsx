'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { PostData } from '@/types/bsky'
import { useBskyBackup } from '@/hooks/useBskyBackup'

interface BackupContextType {
  posts: PostData[]
  isLoading: boolean
  filters: {
    hasMedia: boolean | null
    mediaType: string | null
  }
  addFilter: () => void
  removeFilter: () => void
  clearFilters: () => void
  refresh: () => Promise<void>
  runBackup: () => Promise<PostData[]>
  pruneBsky: () => Promise<PostData[]>
}

// Create the context
const BskyBackupContext = createContext<BackupContextType | undefined>(
  undefined
)

interface BskyBackupProviderProps {
  children: ReactNode
}

export default function BskyBackupProvider({
  children,
}: BskyBackupProviderProps) {
  const [filters, setFilters] = useState<{
    hasMedia: boolean | null
    mediaType: string | null
  }>({
    hasMedia: null,
    mediaType: null,
  })
  const { backup, loading, refresh, runBackup, pruneBsky } = useBskyBackup()
  const contextValue: BackupContextType = {
    posts: backup,
    isLoading: loading,
    filters,
    addFilter: () => {
      // Implement filter logic
    },
    removeFilter: () => {
      // Implement filter removal logic
    },
    clearFilters: () => {
      // Implement clear filters logic
    },
    refresh,
    runBackup,
    pruneBsky,
  }

  return (
    <BskyBackupContext.Provider value={contextValue}>
      {children}
    </BskyBackupContext.Provider>
  )
}

export const useBskyBackupContext = () => {
  const context = useContext(BskyBackupContext)
  if (context === undefined) {
    throw new Error(
      'useBskyBackupContext must be used within a BskyBackupProvider'
    )
  }
  return context
}
