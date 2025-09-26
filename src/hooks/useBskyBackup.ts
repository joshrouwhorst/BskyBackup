import { PostData } from '@/types/bsky'
import { useCallback, useEffect, useState } from 'react'

export function useBskyBackup() {
  const [backup, setBackup] = useState<PostData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchBackup = useCallback(async () => {
    const response = await fetch('/api/backup')
    if (!response.ok) {
      throw new Error('Failed to fetch backup data')
    }
    const data: PostData[] = await response.json()
    return data
  }, [])

  const runBackup = useCallback(async () => {
    setLoading(true)
    const response = await fetch('/api/backup', {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error('Failed to run backup')
    }
    const data: PostData[] = await response.json()
    setLoading(false)
    return data
  }, [])

  const pruneBsky = useCallback(async () => {
    setLoading(true)
    const response = await fetch('/api/prune', {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error('Failed to prune data')
    }
    const data: PostData[] = await response.json()
    setLoading(false)
    return data
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackup()
      setBackup(data)
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [fetchBackup])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { backup, loading, error, refresh, runBackup, pruneBsky }
}
