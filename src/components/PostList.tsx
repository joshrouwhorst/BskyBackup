'use client'

import React from 'react'
import { PostData } from '@/types/bsky'
import { DraftPost } from '@/types/drafts'
import Post from '@/components/Post'

interface PostListProps {
  context: () => {
    posts?: PostData[]
    drafts?: DraftPost[]
    isLoading: boolean
  }
}

export default function PostList({ context }: PostListProps) {
  const { posts, drafts, isLoading } = context()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading posts...</span>
      </div>
    )
  }

  if ((!posts || posts.length === 0) && (!drafts || drafts.length === 0)) {
    return <div>No posts</div>
  }

  return (
    <div className="relative">
      <ul className="flex flex-col items-center">
        {posts &&
          posts.map((post, index) => (
            <li key={index} className="w-full max-w-2xl mb-4">
              <Post postData={post} />
            </li>
          ))}
        {drafts &&
          drafts.map((draft, index) => (
            <li key={index} className="w-full max-w-2xl mb-4">
              <Post draftPost={draft} />
            </li>
          ))}
      </ul>
    </div>
  )
}
