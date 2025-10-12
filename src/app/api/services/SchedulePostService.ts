import type {
  ScheduleFrequency,
  Schedule,
  CreateScheduleRequest,
  ScheduleLookups,
} from '@/types/scheduler'
import { getAppData, saveAppData } from '@/app/api/helpers/appData'
import {
  getDraftPosts,
  getDraftPostsInGroup,
  publishDraftPost,
} from './DraftPostService'
import type { DraftPost } from '@/types/drafts'
import Logger from '../helpers/logger'
import { getNextDatetime } from '../helpers/getNextDatetime'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { DEFAULT_GROUP } from '@/config/main'
import { wait } from '@/helpers/utils'
dayjs.extend(utc)
dayjs.extend(timezone)

const logger = new Logger('SdPostServ')

interface ScheduleData {
  schedules: Schedule[]
}

export async function getSchedules(): Promise<Schedule[]> {
  const appData = await getAppData()
  return appData.schedules || []
}

async function updateScheduleData(data: Partial<ScheduleData>): Promise<void> {
  logger.log(`Updating schedules.`, data)
  const appData = await getAppData()
  const updatedData = {
    ...appData,
    ...data,
  }
  await saveAppData(updatedData)
}

function cleanFrequency(frequency: ScheduleFrequency): ScheduleFrequency {
  const cleanedFrequency = { ...frequency }

  switch (cleanedFrequency.interval.unit) {
    case 'minutes':
    case 'hours':
      cleanedFrequency.timesOfDay = []
      cleanedFrequency.daysOfWeek = []
      cleanedFrequency.daysOfMonth = []
      break
    case 'days':
      cleanedFrequency.daysOfWeek = []
      cleanedFrequency.daysOfMonth = []
      break
    case 'weeks':
      cleanedFrequency.daysOfMonth = []
      break
    case 'months':
      cleanedFrequency.daysOfWeek = []
      break
  }

  return cleanedFrequency
}

export async function createSchedule(
  request: CreateScheduleRequest
): Promise<Schedule> {
  const schedules = await getSchedules()

  const schedule: Schedule = {
    id: `schedule-${Date.now()}`,
    name: request.name,
    frequency: cleanFrequency(request.frequency),
    isActive: request.isActive ?? true,
    createdAt: new Date().toISOString(),
    platforms: request.platforms,
    group: request.group || DEFAULT_GROUP,
  }

  const updatedSchedules = [...schedules, schedule]
  await updateScheduleData({ schedules: updatedSchedules })

  return schedule
}

export async function updateSchedule(
  scheduleId: string,
  updates: Partial<Schedule>
): Promise<Schedule> {
  logger.log(`Updating schedule ${scheduleId}`, updates)
  const schedules = await getSchedules()
  const scheduleIndex = schedules.findIndex((s) => s.id === scheduleId)

  if (scheduleIndex === -1) {
    throw new Error(`Schedule ${scheduleId} not found`)
  }

  const updatedSchedule = { ...schedules[scheduleIndex], ...updates }

  if (updates.frequency) {
    updatedSchedule.frequency = cleanFrequency(updates.frequency)
  }

  schedules[scheduleIndex] = updatedSchedule
  await updateScheduleData({ schedules })

  return updatedSchedule
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  logger.log(`Deleting schedule ${scheduleId}.`)
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
  logger.log(`Reordering posts for schedule ${scheduleId}.`, { newOrder })
  const schedule = (await getSchedules()).find((s) => s.id === scheduleId)
  if (!schedule) {
    throw new Error(`Schedule ${scheduleId} not found`)
  }

  const group = schedule.group || 'default'
  const postsToReorder = await getDraftPostsInGroup(group)

  if (postsToReorder.length !== newOrder.length) {
    throw new Error('New order length does not match number of scheduled posts')
  }

  const idSet = new Set(postsToReorder.map((p) => p.meta.directoryName))
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

export async function getScheduleLookups(
  scheduleId: string,
  postDates: number = 1
): Promise<ScheduleLookups> {
  const nextPost = await getNextPost(scheduleId)
  let nextPostDates: Date[] = []
  const schedules = await getSchedules()
  const schedule = schedules.find((s) => s.id === scheduleId)
  if (schedule?.isActive) {
    nextPostDates = getNextTriggerTimes(
      schedule.lastTriggered ? new Date(schedule.lastTriggered) : null,
      schedule.frequency,
      postDates
    )
  }
  return { nextPost, nextPostDates }
}

export async function getNextPost(
  scheduleId: string
): Promise<DraftPost | null> {
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
  logger.opening('Publish Next Post Process')

  const schedules = await getSchedules()
  const schedule = schedules.find((s) => s.id === scheduleId)

  if (!schedule || !schedule.isActive) {
    logger.log(`Schedule ${scheduleId} is not active or not found.`)
    logger.closing('Publish Next Post Process')
    return
  }

  // Update schedule last triggered
  schedule.lastTriggered = new Date().toISOString()
  schedule.nextTrigger = getNextTriggerTime(
    new Date(schedule.lastTriggered),
    schedule.frequency
  ).toISOString()

  const post = await getNextPost(scheduleId)

  if (!post) {
    await updateScheduleData({ schedules })
    logger.log(`No post found to publish for schedule ID: ${scheduleId}`)
    logger.closing('Publish Next Post Process')
    return
  }

  logger.log(`Schedule ${scheduleId} found: ${schedule.name}`)

  logger.log(
    `Next post for schedule ${schedule.name} is ${post.meta.directoryName}.`
  )

  // Just send to bluesky if no platforms specified
  if (!schedule.platforms || schedule.platforms.length === 0) {
    schedule.platforms = ['bluesky']
  }

  let attempts = 0
  const maxAttempts = 3
  let successful = false
  while (attempts < maxAttempts) {
    try {
      logger.log(
        `Posting ${post.meta.directoryName} for schedule ${
          schedule.name
        } (Attempt ${attempts + 1})`
      )
      await publishDraftPost(post.meta.directoryName, schedule.platforms)
      successful = true
      break // Success, exit loop
    } catch (error) {
      attempts++
      logger.error(
        `Failed to publish ${post.meta.directoryName} for schedule ${schedule.name} (Attempt ${attempts}):`,
        error
      )

      if (attempts >= maxAttempts) {
        logger.error(
          `Giving up after ${maxAttempts} attempts to publish ${post.meta.directoryName} for schedule ${schedule.name}.`
        )
      } else {
        await wait(5000) // Wait 5 seconds before retrying
      }
    }
  }

  if (!successful) {
    logger.log(`Successfully posted draft ${post.meta.directoryName}`)
  } else {
    logger.log(
      `Failed to post draft ${post.meta.directoryName} after ${maxAttempts} attempts.`
    )
  }

  await updateScheduleData({ schedules })

  logger.closing('Publish Next Post Process')
  return
}

export function getNextTriggerTime(
  lastRun: Date | null,
  frequency: ScheduleFrequency
): Date {
  if (!lastRun) lastRun = new Date()
  const { interval, timesOfDay, timeZone, daysOfWeek, daysOfMonth } = frequency
  const { every, unit } = interval

  const run = getNextDatetime(
    lastRun,
    every,
    unit,
    timesOfDay,
    timeZone,
    daysOfWeek,
    daysOfMonth
  )

  return run.length > 0 ? run[0] : lastRun
}

export function getNextTriggerTimes(
  lastRun: Date | null,
  frequency: ScheduleFrequency,
  count: number = 1
): Date[] {
  if (!lastRun) lastRun = new Date()
  const { interval, timesOfDay, timeZone, daysOfWeek, daysOfMonth } = frequency
  const { every, unit } = interval

  const run = getNextDatetime(
    lastRun,
    every,
    unit,
    timesOfDay,
    timeZone,
    daysOfWeek,
    daysOfMonth,
    count
  )

  return run.length > 0 ? run : [lastRun]
}
