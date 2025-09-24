'use client'
import { Edit, ArrowUp, ArrowDown } from 'lucide-react'
import { Button, LinkButton } from '@/components/ui/forms'
import { DraftPost } from '@/types/drafts'
import { useGroups } from '@/hooks/useGroups'
import { useDrafts } from '@/hooks/useDrafts'
import { useEffect, useState } from 'react'

interface ReorderGroupPostsProps {
  group: string
}
  
export default function ReorderGroupPosts({
  group,
}: ReorderGroupPostsProps) {
  const { reorderGroupPosts } = useGroups()
  const { getDraftsInGroup } = useDrafts()
  const [posts, setPosts] = useState<DraftPost[]>([])

  useEffect(() => {
    async function fetchDrafts() {
      const drafts = await getDraftsInGroup(group)

      // Set priority for drafts without one, add to back of list
      const newDrafts = drafts.filter(d => d.meta.priority === -1).sort((a, b) => {
        const aDate = new Date(a.meta.createdAt).getTime()
        const bDate = new Date(b.meta.createdAt).getTime()
        return aDate - bDate
      })

      newDrafts.forEach((d, idx) => {
        d.meta.priority = drafts.length - newDrafts.length + idx + 1
      })

      setPosts(drafts)
    }
    fetchDrafts()
  }, [getDraftsInGroup, group])

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
    return <div>No scheduled posts in this group.</div>
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Scheduled Posts</h2>
      <ul>
        {posts.sort((a, b) => a.meta.priority - b.meta.priority).map((post, idx) => {
          if (!post) return null
          return (
            <li key={post.meta.id} className="flex items-center gap-2 py-1">
              <span className="font-mono text-xs text-gray-500">
                {idx + 1}.
              </span>
              <span className="flex-1">
                {post.meta.text?.slice(0, 80) || '(No text)'}
              </span>
              <Button
                variant="icon"
                size="xxs"
                onClick={() => {
                  if (idx <= 0) return
                  const newOrder = posts.map(p => p.meta.id)
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
                size="xxs"
                onClick={() => {
                  const order = posts.map(p => p.meta.id)
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
                size="xxs"
                href={`/drafts/${post.meta.id}`}
              >
                <Edit />
              </LinkButton>
              {/* Add drag handle here if using a drag-and-drop lib */}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
