'use client'
import type { DraftPost } from '@/types/drafts'
import { useSchedules } from '@/hooks/useSchedules'
import { useEffect, useState } from 'react'
import Post from './Post'
import { formatFullDateTime } from '@/helpers/utils'
import DragDropList from '@/components/ui/DragDropList'
import Spinner from './Spinner'

interface ReorderSchedulePostsProps {
  scheduleId: string
}

export default function ReorderSchedulePosts({
  scheduleId,
}: ReorderSchedulePostsProps) {
  const { schedules, getScheduleLookups, reorderSchedulePosts } = useSchedules()
  const [nextPosts, setNextPosts] = useState<DraftPost[]>([])
  const [nextPostDates, setNextPostDates] = useState<Date[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchDrafts() {
      const schedule = schedules.find((s) => s.id === scheduleId)
      setIsLoading(true)
      if (schedule?.isActive && schedule?.id) {
        const lookups = await getScheduleLookups(schedule.id)
        setNextPostDates(lookups?.nextPostDates || [])
        setNextPosts(lookups?.nextPosts || [])
      } else {
        setNextPostDates([])
        setNextPosts([])
      }
      setIsLoading(false)
    }
    fetchDrafts()
  }, [scheduleId, schedules, getScheduleLookups])

  const handleReorder = async (newOrder: string[]) => {
    setIsLoading(true)
    try {
      await reorderSchedulePosts(scheduleId, newOrder)
      const schedule = schedules.find((s) => s.id === scheduleId)
      const order = schedule?.postOrder || []
      // After reordering, fetch the updated posts to reflect changes
      const newPosts =
        nextPosts.sort((a, b) => {
          return (
            order.indexOf(a.meta.directoryName) -
            order.indexOf(b.meta.directoryName)
          )
        }) || []

      setNextPosts(newPosts)
    } catch (error) {
      console.error('Failed to reorder posts:', error)
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="my-10 text-center">
        <Spinner />
      </div>
    )
  }

  if (nextPosts.length === 0) {
    return (
      <div className="my-10 text-center text-lg font-bold text-gray-500">
        No posts in this schedule.
      </div>
    )
  }

  return (
    <div>
      <DragDropList onChange={handleReorder}>
        {nextPosts.map((post, idx) => {
          return (
            <DragDropList.Item key={post.meta.directoryName}>
              <div className="flex flex-col gap-2 py">
                <div className="text-xl">
                  {nextPostDates[idx]
                    ? formatFullDateTime(new Date(nextPostDates[idx]))
                    : 'No Date'}
                </div>
                <Post draftPost={post} variant="compact" />
              </div>
            </DragDropList.Item>
          )
        })}
      </DragDropList>
    </div>
  )
}
