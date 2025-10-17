import { NextResponse } from 'next/server'
import type { DraftPost } from '@/types/drafts'
import {
  deleteDraftPost,
  getDraftPost,
  updateDraftPost,
  duplicateDraftPost,
  publishDraftPost,
} from '@/app/api/services/DraftPostService'
import Logger from '@/app/api-helpers/logger'
import { withBskyLogoutWithId } from '@/app/api-helpers/apiWrapper'

const logger = new Logger('DraftRoute')

export const GET = withBskyLogoutWithId(async (id) => {
  try {
    const post = await getDraftPost(id)
    if (!post) {
      logger.error('Post not found for ID:', id)
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    return NextResponse.json(post)
  } catch (error) {
    logger.error('Failed to fetch post for GET request', error)
    return NextResponse.json(
      {
        error: id ? 'Failed to fetch post' : 'Failed to fetch app data',
      },
      { status: 500 }
    )
  }
})

export const POST = withBskyLogoutWithId(async (id, request) => {
  try {
    const url = new URL(request.url)
    const duplicate = url.searchParams.get('duplicate')
    const publish = url.searchParams.get('publish')
    if (!id) {
      logger.error('Post ID not provided for POST request')
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    if (duplicate === 'true') {
      const duplicatedPost = await duplicateDraftPost(id)
      return NextResponse.json(duplicatedPost, { status: 201 })
    } else if (publish === 'true') {
      await publishDraftPost(id)
      return NextResponse.json({ message: 'Post published' }, { status: 201 })
    } else {
      logger.error('Invalid action for POST request')
      return NextResponse.json(
        { error: 'Invalid action. To duplicate, set duplicate=true in query.' },
        { status: 400 }
      )
    }
  } catch (error) {
    logger.error('Failed to process POST request', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
})

export const PUT = withBskyLogoutWithId(async (id, request) => {
  try {
    if (!id) {
      logger.error('Post ID is required for PUT request')
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }
    const input: DraftPost = await request.json()
    const newPost = await updateDraftPost(id, input)
    return NextResponse.json(newPost, { status: 201 })
  } catch (error) {
    logger.error('Failed to update post', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
})

export const DELETE = withBskyLogoutWithId(async (id) => {
  try {
    if (!id) {
      logger.error('Post ID is required for DELETE request')
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }
    await deleteDraftPost(id)
    return NextResponse.json({ message: 'Post deleted' })
  } catch (error) {
    logger.error('Failed to delete post', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
})
