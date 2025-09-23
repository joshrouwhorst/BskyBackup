import { NextResponse } from 'next/server'
import { DraftPost } from '@/types/drafts'
import {
  deleteDraftPost,
  getDraftPost,
  updateDraftPost,
} from '../../services/DraftPostService'

export async function GET(
  request: Request,
  {
    params,
    searchParams,
  }: { params: { id: string }; searchParams: { group?: string } }
) {
  try {
    const { id } = await params
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
        error: params?.id ? 'Failed to fetch post' : 'Failed to fetch app data',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
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
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
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
