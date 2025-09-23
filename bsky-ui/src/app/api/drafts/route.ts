import { NextResponse } from 'next/server'

import {
  getDraftPosts,
  getDraftPost,
  createDraftPost,
  updateDraftPost,
  deleteDraftPost,
  getDraftPostsInGroup,
} from '@/app/api/services/DraftPostService'
import type { CreateDraftInput } from '@/types/drafts'

export async function GET(
  request: Request,
  { params }: { params: { group?: string } }
) {
  await params
  try {
    if (params?.group) {
      const posts = await getDraftPostsInGroup(params.group)
      return NextResponse.json(posts)
    } else {
      const appData = await getDraftPosts()
      return NextResponse.json(appData)
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: params?.group
          ? 'Failed to fetch posts'
          : 'Failed to fetch app data',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json()
    if (Array.isArray(input)) {
      // Handle multiple CreateDraftInputs
      const newPosts = await Promise.all(
        input.map((item: CreateDraftInput) => createDraftPost(item))
      )
      return NextResponse.json(newPosts, { status: 201 })
    } else {
      // Handle single CreateDraftInput
      const newPost = await createDraftPost(input as CreateDraftInput)
      return NextResponse.json(newPost, { status: 201 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create post(s)' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const input: CreateDraftInput = await request.json()
    const updatedPost = await updateDraftPost(params.id, input)
    return NextResponse.json(updatedPost)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}
