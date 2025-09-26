import {
  getNextPost,
  publishNextPost,
} from '../../../services/SchedulePostService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const post = await getNextPost(resolvedParams.id)
    if (!post) {
      return NextResponse.json(
        { error: 'No scheduled posts found' },
        { status: 404 }
      )
    }
    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch scheduled post' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params

    await publishNextPost(resolvedParams.id)

    return NextResponse.json({
      message: 'Schedule triggered successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to trigger schedule' },
      { status: 500 }
    )
  }
}
