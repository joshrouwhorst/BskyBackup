import { NextResponse } from 'next/server'

import {
  getDraftPosts,
  getDraftPost,
  createDraftPost,
  updateDraftPost,
  getDraftPostsInGroup,
} from '@/app/api/services/DraftPostService'
import type { CreateDraftInput, DraftPost } from '@/types/drafts'
import Logger from '@/app/api/helpers/logger'

const logger = new Logger('DraftsRoute')

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  let id = undefined

  if (params) {
    const resolvedParams = await params
    id = resolvedParams.id
  }

  const { searchParams } = new URL(request.url)
  const group = searchParams.get('group') || undefined
  const searchTerm = searchParams.get('searchTerm') || undefined

  try {
    if (id) {
      const post = await getDraftPost(id)
      return NextResponse.json(post)
    }

    let posts: DraftPost[] = []
    if (group) {
      posts = await getDraftPostsInGroup(group)
    } else {
      posts = await getDraftPosts()
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      posts = posts.filter((post) => {
        return (
          post.meta.slug.toLowerCase().includes(lowerSearchTerm) ||
          post.group.toLowerCase().includes(lowerSearchTerm) ||
          post.meta.text?.toLowerCase().includes(lowerSearchTerm)
        )
      })
    }

    return NextResponse.json(posts)
  } catch (error) {
    logger.error('Failed to fetch posts', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch posts',
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
    logger.error('Failed to create post(s)', error)
    return NextResponse.json(
      { error: 'Failed to create post(s)' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const input: CreateDraftInput = await request.json()
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const updatedPost = await updateDraftPost(id, input)
    return NextResponse.json(updatedPost)
  } catch (error) {
    logger.error('Failed to update post', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}
