import Logger from '@/app/api-helpers/logger'
import {
  getSchedules,
  updateSchedule,
  getNextTriggerTime,
  publishNextPost,
} from '../services/SchedulePostService'
import { cron } from '@/app/api-helpers/cron'

const CRON_MINUTES = 5
const TASK_ID = `task-cron`

const logger = new Logger('CronService')
init()

async function init() {
  logger.log('Initializing Cron Service...')
  await ensureCronIsRunning()
}

export async function ensureCronIsRunning() {
  if (!cron.hasTask(TASK_ID)) {
    logger.log(
      `Adding cron job to run at ${new Date(
        Date.now() + CRON_MINUTES * 60 * 1000
      ).toISOString()}`
    )
    cron.addTask(
      TASK_ID,
      () => {
        cronJob()
      },
      CRON_MINUTES * 60 * 1000
    )
  } else {
    logger.log('Cron job already running')
  }
}

async function cronJob() {
  await postIfNeeded()
  if (cron.hasTask(TASK_ID)) cron.removeTask(TASK_ID)

  cron.addTask(
    TASK_ID,
    () => {
      cronJob()
    },
    CRON_MINUTES * 60 * 1000
  )
}

export async function postIfNeeded() {
  const schedules = await getSchedules()
  const now = new Date()
  for (const schedule of schedules) {
    if (!schedule.isActive || !schedule.id || !schedule.group) continue

    if (!schedule.lastTriggered) {
      logger.log(
        `Schedule ${schedule.id} has never been triggered. Setting lastTriggered to now.`
      )
      await updateSchedule(schedule.id, { lastTriggered: now.toISOString() })
      schedule.lastTriggered = now.toISOString()
    }

    const nextRun = getNextTriggerTime(
      new Date(schedule.lastTriggered),
      schedule.frequency
    )

    if (nextRun <= now) {
      logger.log(
        `Triggering scheduled post for group ${
          schedule.group
        } (scheduled for ${nextRun.toISOString()})`
      )
      await publishNextPost(schedule.id)
      await updateSchedule(schedule.id, { lastTriggered: now.toISOString() })
    }
  }
}

export function unscheduleAll() {
  cron.clearAll()
  logger.log('Cleared all scheduled tasks')
}
