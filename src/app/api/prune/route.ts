import { NextResponse } from 'next/server'
import { prunePosts } from '../services/BackupService'
import Logger from '@/app/api-helpers/logger'
import { withBskyLogoutAndErrorHandling } from '../../api-helpers/apiWrapper'

const logger = new Logger('PruneRoute')

export const POST = withBskyLogoutAndErrorHandling(async () => {
  try {
    logger.log('Prune API request received')
    await prunePosts()
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to prune posts', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
