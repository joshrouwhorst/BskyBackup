'use client'

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react'
import { CreateDraftInput, DraftPost } from '@/types/drafts'
import { useDrafts } from '@/hooks/useDrafts'
import { wait } from '@/helpers/utils'

interface DraftsContextType {
  drafts: DraftPost[]
  isLoading: boolean
  filters: {
    hasMedia: boolean | null
    mediaType: string | null
  }
  error: Error | null
  addFilter: () => void
  removeFilter: () => void
  clearFilters: () => void
  refresh: () => Promise<void>
  createDraft: (input: CreateDraftInput) => Promise<DraftPost>
  getDraft: (id: string, group?: string) => Promise<DraftPost | null>
  updateDraft: (
    id: string,
    input: Partial<CreateDraftInput>
  ) => Promise<DraftPost | null>
  deleteDraft: (id: string) => Promise<void>
}

// Create the context
const DraftContext = createContext<DraftsContextType | undefined>(undefined)

interface DraftProviderProps {
  children: ReactNode
}

interface DraftState {
  hasInitialized: boolean
  drafts: DraftPost[]
  isLoading: boolean
  error: Error | null
}

export default function DraftProvider({ children }: DraftProviderProps) {
  const [filters, setFilters] = useState<{
    hasMedia: boolean | null
    mediaType: string | null
  }>({
    hasMedia: null,
    mediaType: null,
  })
  const [state, setState] = useState<DraftState>({
    hasInitialized: false,
    drafts: [],
    isLoading: false,
    error: null,
  })
  const { hasInitialized, drafts, isLoading, error } = state

  const { createDraft, getDraft, updateDraft, fetchDrafts, deleteDraft } =
    useDrafts()

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const data = await fetchDrafts()
      await setState((prev) => ({ ...prev, drafts: data }))
    } catch (error) {
      await setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }))
    } finally {
      await setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [fetchDrafts])

  useEffect(() => {
    const load = async () => {
      if (!hasInitialized) {
        await setState((prev) => ({ ...prev, hasInitialized: true }))
        await refresh()
      }
    }
    load()
  }, [refresh, hasInitialized])

  const contextValue: DraftsContextType = {
    drafts,
    error,
    isLoading,
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
    createDraft,
    updateDraft,
    getDraft,
    deleteDraft: async (id: string) => {
      await deleteDraft(id)
      await wait(1000) // slight delay to ensure server is updated
      await refresh()
    },
  }

  return (
    <DraftContext.Provider value={contextValue}>
      {children}
    </DraftContext.Provider>
  )
}

export const useDraftContext = () => {
  const context = useContext(DraftContext)
  if (context === undefined) {
    throw new Error('useDraftContext must be used within a DraftProvider')
  }
  return context
}
