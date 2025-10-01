import { NextResponse } from 'next/server'
import { getAppData } from '../helpers/appData'
import { getScheduledGroups } from '../services/CronService'
import Logger from '../helpers/logger'

const logger = new Logger('AppDataRoute')

export async function GET() {
  try {
    const appData = await getAppData()
    const scheduledGroups = await getScheduledGroups()
    // TODO: Setup stat's own endpoint and get rid of appData exposure
    const { lastBackup, postsOnBsky, totalPostsBackedUp, oldestBskyPostDate } =
      appData // Making sure only to expose these fields
    return NextResponse.json({
      lastBackup,
      postsOnBsky,
      totalPostsBackedUp,
      oldestBskyPostDate,
      scheduledGroups,
    })
  } catch (error) {
    logger.error('Failed to fetch app data', error)
    return NextResponse.json(
      { error: 'Failed to fetch app data' },
      { status: 500 }
    )
  }
}
