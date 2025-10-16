import Logger from '@/app/api-helpers/logger'
import {
  getSchedules,
  updateSchedule,
  getNextTriggerTime,
  publishNextPost,
} from '../services/SchedulePostService'
import { cron } from '@/app/api-helpers/cron'
import { getAppData } from '@/app/api-helpers/appData'
import { runBackup, prunePosts } from './BackupService'

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
  await backupIfNeeded()
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

export async function pruneIfNeeded() {
  const appData = await getAppData()
  const settings = appData.settings
  if (
    !settings?.autoPruneFrequencyMinutes ||
    settings.autoPruneFrequencyMinutes <= 0
  ) {
    return // Auto prune not enabled
  }

  const now = new Date()
  const lastPrune = appData?.lastPrune ? new Date(appData.lastPrune) : null

  if (!lastPrune) {
    logger.log('No previous prune found, running prune now.')
    await prunePosts()
    return
  }

  const nextPrune = new Date(
    lastPrune.getTime() + settings.autoPruneFrequencyMinutes * 60 * 1000
  )

  if (nextPrune <= now) {
    logger.log(
      `Last prune was on ${lastPrune.toISOString()}, running prune now.`
    )

    await prunePosts()
  } else {
    logger.log(`Next prune scheduled for ${nextPrune.toISOString()}, skipping.`)
  }
}

export async function backupIfNeeded() {
  const appData = await getAppData()
  const settings = appData.settings
  if (
    !settings?.autoBackupFrequencyMinutes ||
    settings.autoBackupFrequencyMinutes <= 0
  ) {
    return // Auto backup not enabled
  }

  const now = new Date()
  const lastBackup = appData?.lastBackup ? new Date(appData.lastBackup) : null

  if (!lastBackup) {
    logger.log('No previous backup found, running backup now.')
    const { runBackup } = await import('./BackupService')
    await runBackup()
    return
  }

  const nextBackup = new Date(
    lastBackup.getTime() + settings.autoBackupFrequencyMinutes * 60 * 1000
  )

  if (nextBackup <= now) {
    logger.log(
      `Last backup was on ${lastBackup.toISOString()}, running backup now.`
    )

    await runBackup()
  }
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
