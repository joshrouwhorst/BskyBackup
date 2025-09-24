import {
  reorderSchedulePosts,
  triggerSchedule,
} from '../../../services/SchedulePostService'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params

    await triggerSchedule(resolvedParams.id)

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

