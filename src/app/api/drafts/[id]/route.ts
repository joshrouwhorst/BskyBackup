import { NextRequest, NextResponse } from 'next/server'
import type { DraftPost } from '@/types/drafts'
import {
  deleteDraftPost,
  getDraftPost,
  updateDraftPost,
  duplicateDraftPost,
  publishDraftPost,
} from '../../services/DraftPostService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  const { id } = await params
  try {
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }
    const post = await getDraftPost(id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json(
      {
        error: id ? 'Failed to fetch post' : 'Failed to fetch app data',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  const { id } = await params
  try {
    const url = new URL(request.url)
    const duplicate = url.searchParams.get('duplicate')
    const publish = url.searchParams.get('publish')
    if (!id) {
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
      return NextResponse.json(
        { error: 'Invalid action. To duplicate, set duplicate=true in query.' },
        { status: 400 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  const { id } = await params
  try {
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }
    const input: DraftPost = await request.json()
    const newPost = await updateDraftPost(id, input)
    return NextResponse.json(newPost, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  const { id } = await params
  try {
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }
    await deleteDraftPost(id)
    return NextResponse.json({ message: 'Post deleted' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
