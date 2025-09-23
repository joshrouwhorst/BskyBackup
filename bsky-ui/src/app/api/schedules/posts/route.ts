import {
  getAllSchedulePosts,
  getUnscheduledPosts,
} from '../../services/SchedulePostService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const isScheduled = searchParams.get('isScheduled') === 'true'

    const posts = isScheduled
      ? await getAllSchedulePosts()
      : await getUnscheduledPosts()

    return NextResponse.json({ success: true, data: posts })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
