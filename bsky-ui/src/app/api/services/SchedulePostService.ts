import {
  ScheduleFrequency,
  Schedule,
  CreateScheduleRequest,
} from '@/types/scheduler'
import { getAppData, saveAppData } from '@/app/api/helpers/appData'
import {
  getDraftPosts,
  getDraftPostsInGroup,
  publishDraftPost,
} from './DraftPostService'
import { DraftPost } from '@/types/drafts'
import Logger from '../helpers/logger'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(timezone)

interface ScheduleData {
  schedules: Schedule[]
}

export async function getSchedules(): Promise<Schedule[]> {
  const appData = await getAppData()
  return appData.schedules || []
}

async function updateScheduleData(data: Partial<ScheduleData>): Promise<void> {
  Logger.log(`Updating schedules.`, data)
  const appData = await getAppData()
  const updatedData = {
    ...appData,
    ...data,
    lastBackup: new Date().toISOString(),
  }
  await saveAppData(updatedData)
}

export async function createSchedule(
  request: CreateScheduleRequest
): Promise<Schedule> {
  const schedules = await getSchedules()

  const schedule: Schedule = {
    id: `schedule-${Date.now()}`,
    name: request.name,
    frequency: request.frequency,
    isActive: request.isActive ?? true,
    createdAt: new Date().toISOString(),
    platforms: request.platforms,
    group: request.group || 'default', // <-- Add this line
  }

  const updatedSchedules = [...schedules, schedule]
  await updateScheduleData({ schedules: updatedSchedules })

  return schedule
}

export async function updateSchedule(
  scheduleId: string,
  updates: Partial<Schedule>
): Promise<Schedule> {
  Logger.log(`Updating schedule ${scheduleId}`, updates)
  const schedules = await getSchedules()
  const scheduleIndex = schedules.findIndex((s) => s.id === scheduleId)

  if (scheduleIndex === -1) {
    throw new Error(`Schedule ${scheduleId} not found`)
  }

  const updatedSchedule = { ...schedules[scheduleIndex], ...updates }

  schedules[scheduleIndex] = updatedSchedule
  await updateScheduleData({ schedules })

  return updatedSchedule
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  Logger.log(`Deleting schedule ${scheduleId}.`)
  const schedules = await getSchedules()

  const updatedSchedules = schedules.filter((s) => s.id !== scheduleId)

  await updateScheduleData({
    schedules: updatedSchedules,
  })
}

export async function reorderSchedulePosts(
  scheduleId: string,
  newOrder: string[]
): Promise<void> {
  Logger.log(`Reordering posts for schedule ${scheduleId}.`, { newOrder })
  const schedule = (await getSchedules()).find((s) => s.id === scheduleId)
  if (!schedule) {
    throw new Error(`Schedule ${scheduleId} not found`)
  }

  const group = schedule.group || 'default'
  const postsToReorder = await getDraftPostsInGroup(group)

  if (postsToReorder.length !== newOrder.length) {
    throw new Error('New order length does not match number of scheduled posts')
  }

  const idSet = new Set(postsToReorder.map((p) => p.meta.id))
  for (const id of newOrder) {
    if (!idSet.has(id)) {
      throw new Error(`Post ID ${id} is not part of the scheduled posts`)
    }
  }

  await reorderSchedulePosts(scheduleId, newOrder)
}

export async function getSchedulePosts(
  scheduleId: string
): Promise<DraftPost[]> {
  const schedule = (await getSchedules()).find((s) => s.id === scheduleId)
  if (!schedule) {
    throw new Error(`Schedule ${scheduleId} not found`)
  }

  const posts = await getDraftPosts()
  return posts
    .filter((p) => p.group === schedule.group)
    .sort((a, b) => a.meta.priority - b.meta.priority)
}

async function getNextPost(scheduleId: string): Promise<DraftPost | null> {
  const schedules = await getSchedules()
  const schedule = schedules.find((s) => s.id === scheduleId)
  if (!schedule) return null

  // Get all scheduled posts for this schedule's group
  const scheduledPosts = await getDraftPostsInGroup(schedule.group)

  const newPosts = scheduledPosts.filter((p) => p.meta.priority === -1)
  newPosts.sort((a, b) => {
    const aDate = new Date(a.meta.createdAt).getTime()
    const bDate = new Date(b.meta.createdAt).getTime()
    return aDate - bDate
  })

  // Assign priority to new posts, adding them to the end of the list
  newPosts.forEach((p, idx) => {
    p.meta.priority = scheduledPosts.length - newPosts.length + idx + 1
  })

  // Sort by DraftPost.priority (lower number = higher priority)
  scheduledPosts.sort((a, b) => a.meta.priority - b.meta.priority)

  return scheduledPosts[0] || null
}

export async function publishNextPost(scheduleId: string): Promise<void> {
  Logger.opening('Publish Next Post Process')

  const schedules = await getSchedules()
  const schedule = schedules.find((s) => s.id === scheduleId)

  if (schedule) {
    // Update schedule last triggered
    schedule.lastTriggered = new Date().toISOString()
    schedule.nextTrigger = getNextTriggerTime(
      new Date(schedule.lastTriggered),
      schedule.frequency
    ).toISOString()
  }

  const post = await getNextPost(scheduleId)

  if (!post) {
    await updateScheduleData({ schedules })
    Logger.log(`No post found to publish for schedule ID: ${scheduleId}`)
    Logger.closing('Publish Next Post Process')
    return
  }

  if (!schedule || !schedule.isActive) return
  Logger.log(`Schedule ${scheduleId} found: ${schedule.name}`)

  const nextPost = await getNextPost(scheduleId)
  if (!nextPost) {
    Logger.log(`No pending posts for schedule ${schedule.name}`)
    Logger.closing('Publish Next Post Process')
    return
  }

  Logger.log(`Next post for schedule ${schedule.name} is ${nextPost.meta.id}.`)

  // Just send to bluesky if no platforms specified
  if (!schedule.platforms || schedule.platforms.length === 0) {
    schedule.platforms = ['bluesky']
  }

  try {
    Logger.log(`Posting ${nextPost.meta.id} for schedule ${schedule.name}`)
    await publishDraftPost(nextPost.meta.id, schedule.platforms)
  } catch (error) {
    Logger.error(
      `Failed to publish ${nextPost.meta.id} for schedule ${schedule.name}:`,
      error
    )
  }

  Logger.log(`Successfully posted draft ${nextPost.meta.id}`)
  await updateScheduleData({ schedules })
  Logger.closing('Publish Next Post Process')
  return
}

export function getNextDatetime(
  start: Date,
  every: number,
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years',
  timeOfDay?: string,
  timeZone?: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  // Calculate the next datetime based on the given parameters
  let result = dayjs(start)

  if (unit === 'minutes') {
    result = result.add(every, 'minute')
  } else if (unit === 'hours') {
    result = result.add(every, 'hour')
  } else if (unit === 'days') {
    result = result.add(every - 1, 'day')
    if (timeOfDay) {
      const [h, m] = timeOfDay.split(':').map(Number)
      result = result.hour(h).minute(m).second(0).millisecond(0)
    }
    if (result.isBefore(dayjs(start)) || result.isSame(dayjs(start))) {
      result = result.add(1, 'day')
    }
  } else if (unit === 'weeks') {
    result = result.add((every - 1) * 7, 'day')
    if (typeof dayOfWeek === 'number') {
      // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      let daysToAdd = (dayOfWeek - result.day() + 7) % 7
      if (
        daysToAdd === 0 &&
        (result.isBefore(dayjs(start)) || result.isSame(dayjs(start)))
      )
        daysToAdd = 7
      result = result.add(daysToAdd, 'day')
    }
    if (timeOfDay) {
      const [h, m] = timeOfDay.split(':').map(Number)
      result = result.hour(h).minute(m).second(0).millisecond(0)
    }
    if (result.isBefore(dayjs(start)) || result.isSame(dayjs(start))) {
      result = result.add(7, 'day')
    }
  } else if (unit === 'months') {
    result = result.add(every - 1, 'month')
    if (typeof dayOfMonth === 'number') {
      const daysInMonth = result.daysInMonth()
      result = result.date(Math.min(dayOfMonth, daysInMonth))
    }
    if (timeOfDay) {
      const [h, m] = timeOfDay.split(':').map(Number)
      result = result.hour(h).minute(m).second(0).millisecond(0)
    }
    if (result.isBefore(dayjs(start)) || result.isSame(dayjs(start))) {
      result = result.add(1, 'month')
    }
  } else {
    result = result.add(every - 1, 'year')
    if (typeof dayOfMonth === 'number') {
      const daysInMonth = result.daysInMonth()
      result = result.date(Math.min(dayOfMonth, daysInMonth))
    }
    if (timeOfDay) {
      const [h, m] = timeOfDay.split(':').map(Number)
      result = result.hour(h).minute(m).second(0).millisecond(0)
    }
    if (result.isBefore(dayjs(start)) || result.isSame(dayjs(start))) {
      result = result.add(1, 'year')
    }
  }

  // If a timeZone is specified, convert the intended local time to the correct UTC time
  if (timeZone && timeOfDay) {
    result = dayjs(
      timezoneOffset(result.format('YYYY-MM-DD'), timeOfDay, timeZone)
    )
  }

  return result.toDate()
}

export function timezoneOffset(
  date: string,
  time: string,
  timeZone: string
): string {
  const d = dayjs.tz(`${date} ${time}`, timeZone)
  return d.toISOString()
}

export function getNextTriggerTime(
  lastRun: Date | null,
  frequency: ScheduleFrequency
): Date {
  if (!lastRun) lastRun = new Date()
  const { interval, timeOfDay, timeZone, dayOfWeek, dayOfMonth } = frequency
  const { every, unit } = interval

  let run = getNextDatetime(
    lastRun,
    every,
    unit,
    timeOfDay,
    timeZone,
    dayOfWeek,
    dayOfMonth
  )

  return run
}
