import { NextRequest, NextResponse } from 'next/server'
import { getBackup, runBackup } from '../services/BackupService'
import Logger from '../helpers/logger'

const logger = new Logger('BackupRoute')

export async function GET() {
  try {
    const backup = await getBackup()
    return NextResponse.json(backup)
  } catch (error) {
    logger.error('Failed to fetch backup', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch backup',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await runBackup()

    return NextResponse.json({
      success: true,
      message: 'Backup completed successfully',
    })
  } catch (error) {
    logger.error('Backup failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Backup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
