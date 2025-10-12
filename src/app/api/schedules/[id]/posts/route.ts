import {
  getScheduleLookups,
  publishNextPost,
} from '../../../services/SchedulePostService'
import { NextRequest, NextResponse } from 'next/server'
import Logger from '@/app/api/helpers/logger'
const logger = new Logger('SchPostRoute')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const searchParams = new URL(request.url).searchParams
    const dateCountParam = searchParams.get('dateCount')
    const dateCount = dateCountParam ? parseInt(dateCountParam, 10) : 5
    if (isNaN(dateCount) || dateCount <= 0) {
      return NextResponse.json(
        { error: 'dateCount must be a positive integer' },
        { status: 400 }
      )
    }

    const { id } = await params
    if (!id) {
      logger.error('Schedule ID is required')
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const lookups = await getScheduleLookups(id, dateCount)
    if (!lookups) {
      logger.error('No scheduled lookups found')
      return NextResponse.json(
        { error: 'No scheduled lookups found' },
        { status: 404 }
      )
    }
    return NextResponse.json(lookups)
  } catch (error) {
    logger.error('Failed to fetch scheduled lookups', error)
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
      logger.error('Schedule ID is required')
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
    logger.error('Failed to trigger schedule', error)
    return NextResponse.json(
      { error: 'Failed to trigger schedule' },
      { status: 500 }
    )
  }
}
