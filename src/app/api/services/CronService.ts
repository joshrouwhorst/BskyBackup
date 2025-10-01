import Logger from '@/app/api/helpers/logger'
import {
  getSchedules,
  getNextTriggerTime,
  publishNextPost,
} from '../services/SchedulePostService'
import { cron } from '@/app/api/helpers/cron'
import { Schedule } from '@/types/scheduler'

const logger = new Logger('CronService')

export async function scheduleNextPosts() {
  const schedules = await getSchedules()
  for (const schedule of schedules) {
    if (!schedule.group || !schedule.id || !schedule.isActive) continue // Skip if no group defined
    const id = `schedule-${schedule.group}`
    if (cron.hasTask(id)) continue // Task already scheduled

    let nextRun = getNextTriggerTime(
      schedule.lastTriggered ? new Date(schedule.lastTriggered) : new Date(),
      schedule.frequency
    )

    if (nextRun < new Date()) {
      nextRun = getNextTriggerTime(new Date(), schedule.frequency)
    }

    // Debug logging to trace scheduling

    console.log(
      `Next run for schedule ${schedule.group} is at ${nextRun.toISOString()}`
    )
    console.log(`Current time is ${new Date().toISOString()}`)
    console.log(
      `Schedule interval is every ${schedule.frequency.interval.every} ${schedule.frequency.interval.unit}`
    )

    const now = new Date()

    const success = cron.addTask(
      id,
      async () => {
        await job(schedule)
      },
      nextRun.getTime() - now.getTime()
    )
    if (success)
      logger.log(
        `Scheduled next post for group ${
          schedule.group
        } at ${nextRun.toISOString()}`
      )
  }
}

export function unscheduleAll() {
  cron.clearAll()
  logger.log('Cleared all scheduled tasks')
}

async function job(schedule: Schedule) {
  try {
    if (schedule.id) {
      await publishNextPost(schedule.id)
    } else {
      logger.error(
        `Cannot trigger scheduled post: missing schedule.id for group ${schedule.group}`
      )
    }
  } catch (error) {
    logger.error(
      `Error triggering scheduled post for group ${schedule.group}`,
      error
    )
  } finally {
    cron.removeTask(`schedule-${schedule.group}`)
    await scheduleNextPosts() // Reschedule the next post
  }
}
