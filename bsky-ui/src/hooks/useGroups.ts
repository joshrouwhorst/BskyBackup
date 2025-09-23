import { useCallback } from 'react'

interface GroupHookContext {
  fetchGroups: () => Promise<string[]>
}

export function useGroups(): GroupHookContext {
  const fetchGroups = useCallback(async () => {
    const response = await fetch('/api/groups')
    if (!response.ok) {
      throw new Error('Failed to fetch group data')
    }
    const data: string[] = await response.json()
    return data
  }, [])

  return { fetchGroups }
}
