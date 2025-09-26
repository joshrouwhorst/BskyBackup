'use client'

import React from 'react'
import PostList from '@/components/PostList'
import { useDraftContext } from '@/providers/DraftsProvider'
import { LinkButton } from './ui/forms'
import { Plus } from 'lucide-react'

export default function DraftPostList() {
  return (
    <>
      <div className="relative">
        <PostList context={useDraftContext} />
        <LinkButton
          variant="icon"
          href="/drafts/create"
          className="absolute top-0 right-0 z-10"
        >
          <Plus className="mr-2" />
        </LinkButton>
      </div>
    </>
  )
}
