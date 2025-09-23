import { X, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/forms'
import { DraftPost } from '@/types/drafts'

interface ScheduledPostsProps {
  scheduledPosts: DraftPost[]
  order: string[]
  onRemoveFromSchedule: (postId: string) => void
  onReorder: (newOrder: string[]) => void
}

export default function ScheduledPosts({
  scheduledPosts,
  order,
  onRemoveFromSchedule,
  onReorder,
}: ScheduledPostsProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Scheduled Posts</h2>
      <ul>
        {order.map((postId, idx) => {
          const post = scheduledPosts.find((p) => p.meta.id === postId)
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
                  const newOrder = [...order]
                  ;[newOrder[idx - 1], newOrder[idx]] = [
                    newOrder[idx],
                    newOrder[idx - 1],
                  ]
                  // Call a prop function to handle reorder
                  // For demo, we just log it
                  onReorder?.(newOrder)
                }}
              >
                <ArrowUp />
              </Button>
              <Button
                variant="icon"
                size="xxs"
                onClick={() => {
                  if (idx >= order.length - 1) return
                  const newOrder = [...order]
                  ;[newOrder[idx + 1], newOrder[idx]] = [
                    newOrder[idx],
                    newOrder[idx + 1],
                  ]
                  // Call a prop function to handle reorder
                  // For demo, we just log
                  onReorder?.(newOrder)
                }}
              >
                <ArrowDown />
              </Button>

              <Button
                variant="icon"
                size="xxs"
                onClick={() => onRemoveFromSchedule(post.meta.id)}
              >
                <X />
              </Button>
              {/* Add drag handle here if using a drag-and-drop lib */}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
