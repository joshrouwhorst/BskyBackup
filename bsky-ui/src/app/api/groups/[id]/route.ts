import { NextRequest, NextResponse } from 'next/server'
import {  reorderGroupPosts } from '../../services/DraftPostService'


// Reorder posts in a group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()

    await reorderGroupPosts(resolvedParams.id, body.draftPostIds)

    return NextResponse.json({
      message: 'Post priorities updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update post priorities' },
      { status: 500 }
    )
  }
}

