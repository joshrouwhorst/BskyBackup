import { NextRequest, NextResponse } from 'next/server'
import { prunePosts } from '../services/BackupService'
import Logger from '@/app/api/helpers/logger'

const logger = new Logger('PruneRoute')

export async function POST(request: NextRequest) {
  try {
    await prunePosts()

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to prune posts', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
