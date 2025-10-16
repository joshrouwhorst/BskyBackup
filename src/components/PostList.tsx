'use client'

import React from 'react'
import type { PostData } from '@/types/bsky'
import type { DraftPost } from '@/types/drafts'
import type { PostDisplayData } from '@/types/types'
import Post from '@/components/Post'
import Spinner from './Spinner'

interface PostListProps {
  context: () => {
    posts?: PostDisplayData[]
    backupPosts?: PostData[]
    drafts?: DraftPost[]
    isLoading: boolean
  }
  children?: React.ReactNode
}

export default function PostList({ children, context }: PostListProps) {
  const { posts, backupPosts, drafts, isLoading } = context()

  if (isLoading) {
    return <Spinner />
  }

  if (
    (!posts || posts.length === 0) &&
    (!drafts || drafts.length === 0) &&
    children
  ) {
    return <div>{children}</div>
  } else if (
    (!posts || posts.length === 0) &&
    (!drafts || drafts.length === 0)
  ) {
    return <div className="text-center text-lg text-gray-500">No posts</div>
  }

  return (
    <div className="relative">
      <ul className="flex flex-col items-center">
        {posts?.map((post) => (
          <li key={post.postId} className="w-full mb-4">
            <Post displayData={post} />
          </li>
        ))}
        {backupPosts?.map((post) => (
          <li key={post.post.cid} className="w-full mb-4">
            <Post postData={post} />
          </li>
        ))}
        {drafts?.map((draft) => {
          return (
            <li key={draft.meta?.directoryName} className="w-full mb-4">
              <Post draftPost={draft} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
