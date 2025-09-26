import { DraftPost } from '@/types/drafts'
import { Schedule, CreateScheduleRequest } from '@/types/scheduler'
import { useCallback, useEffect, useState } from 'react'

interface SchedulesHookContext {
  schedules: Schedule[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  createSchedule: (input: CreateScheduleRequest) => Promise<Schedule>
  updateSchedule: (input: Schedule) => Promise<Schedule>
  deleteSchedule: (id: string) => Promise<void>
  triggerSchedule: (scheduleId: string) => Promise<void>
  getNextPost: (scheduleId: string) => Promise<DraftPost | null>
  reorderSchedulePosts: (
    scheduleId: string,
    draftPostIds: string[]
  ) => Promise<void>
}

export function useSchedules(): SchedulesHookContext {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSchedules = useCallback(async () => {
    const response = await fetch('/api/schedules')
    if (!response.ok) {
      throw new Error('Failed to fetch schedule data')
    }
    const data: Schedule[] = await response.json()
    return data
  }, [])

  const createSchedule = useCallback(async (input: CreateScheduleRequest) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })
      if (!response.ok) {
        throw new Error('Failed to create schedule')
      }
      const data: Schedule = await response.json()
      setSchedules((prev) => [...prev, data])
      return data
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error'))
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSchedule = useCallback(async (input: Schedule) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/schedules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })
      if (!response.ok) {
        throw new Error('Failed to update schedule')
      }
      const data: Schedule = await response.json()
      setSchedules((prev) => prev.map((s) => (s.id === data.id ? data : s)))
      return data
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error'))
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSchedule = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/schedules?id=${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete schedule')
      }
      setSchedules((prev) => prev.filter((s) => s.id !== id))
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error'))
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerSchedule = useCallback(async (scheduleId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/posts`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to trigger schedule')
      }
      // Optionally update local state if needed
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error'))
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getNextPost = useCallback(
    async (scheduleId: string): Promise<DraftPost | null> => {
      const response = await fetch(`/api/schedules/${scheduleId}/posts`)
      if (!response.ok) {
        throw new Error('Failed to fetch next post for schedule')
      }
      const data: DraftPost | null = await response.json()
      return data
    },
    []
  )

  const reorderSchedulePosts = useCallback(
    async (scheduleId: string, draftPostIds: string[]) => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/schedules/${scheduleId}/posts`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ draftPostIds }),
        })
        if (!response.ok) {
          throw new Error('Failed to reorder posts in schedule')
        }
        // Optionally update local state if needed
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Unknown error'))
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSchedules()
      setSchedules(data)
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [fetchSchedules])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    schedules,
    loading,
    error,
    refresh,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    reorderSchedulePosts,
    triggerSchedule,
    getNextPost,
  }
}
