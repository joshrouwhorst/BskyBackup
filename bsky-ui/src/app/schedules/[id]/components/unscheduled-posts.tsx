import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/forms'
import { DraftPost } from '@/types/drafts'

export default function UnscheduledPosts({
  unscheduledPosts,
  handleAddToSchedule,
}: {
  unscheduledPosts: DraftPost[]
  handleAddToSchedule: (postId: string) => void
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Unscheduled Drafts</h2>
      <ul>
        {unscheduledPosts ? (
          unscheduledPosts.map((post) => (
            <li key={post.meta.id} className="flex items-center gap-2 py-1">
              <span className="flex-1">
                {post.meta.text?.slice(0, 80) || '(No text)'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddToSchedule(post.meta.id)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </li>
          ))
        ) : (
          <li>No unscheduled posts found.</li>
        )}
      </ul>
    </div>
  )
}
