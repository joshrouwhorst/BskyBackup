import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedules,
} from '../services/SchedulePostService'
import { CronService } from '../services/CronService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    await CronService.scheduleNextPosts() // Ensure cron job is running to handle schedules
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    const schedules = await getSchedules()

    if (scheduleId) {
      const schedule = schedules.find((s) => s.id === scheduleId)
      if (!schedule) {
        return NextResponse.json(
          { error: 'Schedule not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(schedule)
    }
    return NextResponse.json(schedules)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const schedule = await createSchedule(body)
    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    const schedule = await updateSchedule(id, updateData)
    CronService.unscheduleAll()
    await CronService.scheduleNextPosts() // Reschedule cron jobs after update
    return NextResponse.json(schedule)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    await deleteSchedule(scheduleId)
    return NextResponse.json({ message: 'Schedule deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}
