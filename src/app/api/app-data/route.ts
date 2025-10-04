import { NextResponse } from 'next/server'
import { getAppData } from '../helpers/appData'
import Logger from '../helpers/logger'

const logger = new Logger('AppDataRoute')

export async function GET() {
  try {
    const appData = await getAppData()
    // TODO: Setup stat's own endpoint and get rid of appData exposure
    const { lastBackup, postsOnBsky, totalPostsBackedUp, oldestBskyPostDate } =
      appData // Making sure only to expose these fields
    return NextResponse.json({
      lastBackup,
      postsOnBsky,
      totalPostsBackedUp,
      oldestBskyPostDate,
    })
  } catch (error) {
    logger.error('Failed to fetch app data', error)
    return NextResponse.json(
      { error: 'Failed to fetch app data' },
      { status: 500 }
    )
  }
}
