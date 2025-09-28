import {
  getScheduleLookups,
  publishNextPost,
} from '../../../services/SchedulePostService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }
    const lookups = await getScheduleLookups(id)
    if (!lookups) {
      return NextResponse.json(
        { error: 'No scheduled lookups found' },
        { status: 404 }
      )
    }
    return NextResponse.json(lookups)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch scheduled lookups' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    await publishNextPost(id)

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
