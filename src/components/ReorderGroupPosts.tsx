'use client'
import { Edit, ArrowUp, ArrowDown } from 'lucide-react'
import { Button, LinkButton } from '@/components/ui/forms'
import { DraftPost } from '@/types/drafts'
import { useGroups } from '@/hooks/useGroups'
import { useDrafts } from '@/hooks/useDrafts'
import { useSchedules } from '@/hooks/useSchedules'
import { useEffect, useState } from 'react'
import Post from './Post'
import { formatFullDateTime } from '@/helpers/utils'

interface ReorderGroupPostsProps {
  group: string
}

export default function ReorderGroupPosts({ group }: ReorderGroupPostsProps) {
  const { reorderGroupPosts } = useGroups()
  const { getDraftsInGroup } = useDrafts()
  const { schedules, getScheduleLookups } = useSchedules()
  const [posts, setPosts] = useState<DraftPost[]>([])
  const [nextPostDates, setNextPostDates] = useState<Date[]>([])

  useEffect(() => {
    async function fetchDrafts() {
      const drafts = await getDraftsInGroup(group)

      // Set priority for drafts without one, add to back of list
      const newDrafts = drafts
        .filter((d) => d.meta.priority === -1)
        .sort((a, b) => {
          const aDate = new Date(a.meta.createdAt).getTime()
          const bDate = new Date(b.meta.createdAt).getTime()
          return aDate - bDate
        })

      newDrafts.forEach((d, idx) => {
        d.meta.priority = drafts.length - newDrafts.length + idx + 1
      })

      const schedule = schedules.find((s) => s.group === group)
      if (schedule?.isActive && schedule?.id && drafts.length > 0) {
        const lookups = await getScheduleLookups(schedule.id, drafts.length)
        setNextPostDates(lookups?.nextPostDates || [])
      } else setNextPostDates([])

      setPosts(drafts)
    }
    fetchDrafts()
  }, [getDraftsInGroup, group, schedules, getScheduleLookups])

  const handleReorder = async (newOrder: string[]) => {
    try {
      await reorderGroupPosts(group, newOrder)
      // After reordering, fetch the updated posts to reflect changes
      const updatedPosts = await getDraftsInGroup(group)
      setPosts(updatedPosts)
    } catch (error) {
      console.error('Failed to reorder posts:', error)
    }
  }

  if (posts.length === 0) {
    return <div>No posts in this group.</div>
  }

  return (
    <div>
      <ul>
        {posts
          .sort((a, b) => a.meta.priority - b.meta.priority)
          .map((post, idx) => {
            if (!post) return null
            return (
              <li
                key={post.meta.directoryName}
                className="flex flex-row items-center gap-2 py-1"
              >
                <div className="w-1/4 font-mono text-xs text-gray-500">
                  <div className="text-right text-2xl">{idx + 1}</div>
                  <div className="text-right">
                    {nextPostDates.length >= idx + 1 ? (
                      <div className="text-md text-blue-600 dark:text-blue-400">
                        {nextPostDates[idx]
                          ? formatFullDateTime(new Date(nextPostDates[idx]))
                          : 'No Date'}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="w-3/4">
                  <Post draftPost={post} variant="compact" />
                  <div className="flex flex-row gap-1">
                    <Button
                      variant="icon"
                      color="secondary"
                      title="Move Up"
                      onClick={() => {
                        if (idx <= 0) return
                        const newOrder = posts.map((p) => p.meta.directoryName)
                        ;[newOrder[idx - 1], newOrder[idx]] = [
                          newOrder[idx],
                          newOrder[idx - 1],
                        ]
                        // Call a prop function to handle reorder
                        // For demo, we just log it
                        handleReorder(newOrder)
                      }}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="icon"
                      color="secondary"
                      title="Move Down"
                      onClick={() => {
                        const order = posts.map((p) => p.meta.directoryName)
                        if (idx >= order.length - 1) return
                        const newOrder = [...order]
                        ;[newOrder[idx + 1], newOrder[idx]] = [
                          newOrder[idx],
                          newOrder[idx + 1],
                        ]
                        // Call a prop function to handle reorder
                        // For demo, we just log
                        handleReorder(newOrder)
                      }}
                    >
                      <ArrowDown />
                    </Button>

                    <LinkButton
                      variant="icon"
                      color="primary"
                      title="Edit Post"
                      href={`/drafts/${post.meta.directoryName}`}
                    >
                      <Edit />
                    </LinkButton>
                  </div>
                </div>
              </li>
            )
          })}
      </ul>
    </div>
  )
}
