import {
  ScheduleFrequency,
  Schedule,
  CreateScheduleRequest,
} from '@/types/scheduler'
import { getAppData, saveAppData } from '@/app/api/helpers/appData'
import { ScheduledTask, schedule as cronSchedule } from 'node-cron'
import {
  getDraftPosts,
  getDraftPostsInGroup,
  sendToSocialPlatform,
} from './DraftPostService'
import { DraftPost } from '@/types/drafts'

interface ScheduleData {
  schedules: Schedule[]
}

const activeJobs: Map<string, ScheduledTask> = new Map()

export async function getSchedules(): Promise<Schedule[]> {
  const appData = await getAppData()
  return appData.schedules || []
}

async function updateScheduleData(data: Partial<ScheduleData>): Promise<void> {
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
    nextTrigger: calculateNextTrigger(request.frequency),
    group: request.group || 'default', // <-- Add this line
  }

  const updatedSchedules = [...schedules, schedule]
  await updateScheduleData({ schedules: updatedSchedules })

  if (schedule.isActive) {
    startScheduleJob(schedule)
  }

  return schedule
}

export async function updateSchedule(
  scheduleId: string,
  updates: Partial<Schedule>
): Promise<Schedule> {
  const schedules = await getSchedules()
  const scheduleIndex = schedules.findIndex((s) => s.id === scheduleId)

  if (scheduleIndex === -1) {
    throw new Error(`Schedule ${scheduleId} not found`)
  }

  const updatedSchedule = { ...schedules[scheduleIndex], ...updates }
  if (updates.frequency) {
    updatedSchedule.nextTrigger = calculateNextTrigger(updates.frequency)
  }

  schedules[scheduleIndex] = updatedSchedule
  await updateScheduleData({ schedules })

  // Restart job if frequency or active status changed
  if (updates.frequency || updates.isActive !== undefined) {
    stopScheduleJob(scheduleId)
    if (updatedSchedule.isActive) {
      startScheduleJob(updatedSchedule)
    }
  }

  return updatedSchedule
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  const schedules = await getSchedules()

  const updatedSchedules = schedules.filter((s) => s.id !== scheduleId)

  await updateScheduleData({
    schedules: updatedSchedules,
  })

  stopScheduleJob(scheduleId)
}

export async function reorderSchedulePosts(
  scheduleId: string,
  newOrder: string[]
): Promise<void> {
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

  // Sort by DraftPost.priority (lower number = higher priority)
  scheduledPosts.sort((a, b) => a.meta.priority - b.meta.priority)

  return scheduledPosts[0] || null
}

export async function triggerSchedule(scheduleId: string): Promise<void> {
  const schedules = await getSchedules()
  const schedule = schedules.find((s) => s.id === scheduleId)

  if (!schedule || !schedule.isActive) return

  const nextPost = await getNextPost(scheduleId)
  if (!nextPost) {
    console.log(`No pending posts for schedule ${schedule.name}`)
    return
  }

  console.log(
    `Triggering schedule ${
      schedule.name
    }, posting: ${nextPost.meta.text?.substring(0, 50)}...`
  )

  // Just send to bluesky if no platforms specified
  if (!schedule.platforms || schedule.platforms.length === 0) {
    schedule.platforms = ['bluesky']
  }

  // Send to each platform
  for (const platform of schedule.platforms) {
    try {
      console.log(`Posting to ${platform} for schedule ${schedule.name}`)
      await sendToSocialPlatform(nextPost, platform)
    } catch (error) {
      console.error(
        `Failed to post to ${platform} for schedule ${schedule.name}:`,
        error
      )
    }
  }

  console.log(`Successfully posted draft ${nextPost.meta.id}`)

  // Update schedule last triggered
  schedule.lastTriggered = new Date().toISOString()
  schedule.nextTrigger = calculateNextTrigger(schedule.frequency)

  const updatedSchedules = schedules.map((s) =>
    s.id === scheduleId ? schedule : s
  )
  await updateScheduleData({ schedules: updatedSchedules })
}

function calculateNextTrigger(frequency: ScheduleFrequency): string {
  const now = new Date()
  const { interval, timeOfDay, dayOfWeek, dayOfMonth, timeZone } = frequency

  let next = new Date(now)

  switch (interval.unit) {
    case 'minutes':
      next.setMinutes(next.getMinutes() + interval.every)
      break
    case 'hours':
      next.setHours(next.getHours() + interval.every)
      break
    case 'days':
      next.setDate(next.getDate() + interval.every)
      if (timeOfDay) {
        const [hours, minutes] = timeOfDay.split(':').map(Number)
        next.setHours(hours, minutes, 0, 0)
        if (next <= now) {
          next.setDate(next.getDate() + interval.every)
        }
      }
      break
    case 'weeks':
      if (dayOfWeek !== undefined) {
        const daysUntilTarget = (dayOfWeek - next.getDay() + 7) % 7
        next.setDate(next.getDate() + daysUntilTarget)
        if (timeOfDay) {
          const [hours, minutes] = timeOfDay.split(':').map(Number)
          next.setHours(hours, minutes, 0, 0)
        }
        if (next <= now) {
          next.setDate(next.getDate() + 7 * interval.every)
        }
      }
      break
  }

  return next.toISOString()
}

function cronFromFrequency(frequency: ScheduleFrequency): string {
  const { interval, timeOfDay, dayOfWeek, dayOfMonth } = frequency

  const [hours, minutes] = timeOfDay ? timeOfDay.split(':').map(Number) : [0, 0]

  switch (interval.unit) {
    case 'minutes':
      return `*/${interval.every} * * * *`
    case 'hours':
      return `${minutes} */${interval.every} * * *`
    case 'days':
      return `${minutes} ${hours} */${interval.every} * *`
    case 'weeks':
      const day = dayOfWeek ?? 0
      return `${minutes} ${hours} * * ${day}`
    case 'months':
      const monthDay = dayOfMonth ?? 1
      return `${minutes} ${hours} ${monthDay} * *`
    default:
      return `${minutes} ${hours} * * *` // Default to daily
  }
}

function startScheduleJob(schedule: Schedule): void {
  if (!schedule.id) return

  if (activeJobs.has(schedule.id)) {
    stopScheduleJob(schedule.id)
  }

  const cronExpression = cronFromFrequency(schedule.frequency)
  const task = cronSchedule(
    cronExpression,
    () => {
      triggerSchedule(schedule.id!)
    },
    {
      name: schedule.name,
      timezone: schedule.frequency.timeZone || 'UTC',
    }
  )

  task.start()
  activeJobs.set(schedule.id, task)
  console.log(
    `Started schedule job for ${schedule.name} with cron: ${cronExpression}`
  )
}

export function stopScheduleJob(scheduleId: string): void {
  console.log(`Stopping schedule job for ID: ${scheduleId}`)
  const job = activeJobs.get(scheduleId)
  if (job) {
    job.stop()
    activeJobs.delete(scheduleId)
  }
}

export async function startAllActiveSchedules(): Promise<void> {
  const schedules = await getSchedules()
  for (const schedule of schedules) {
    if (schedule.isActive) {
      startScheduleJob(schedule)
    }
  }
}

export async function stopAllSchedules(): Promise<void> {
  for (const [scheduleId] of activeJobs) {
    stopScheduleJob(scheduleId)
  }
}
