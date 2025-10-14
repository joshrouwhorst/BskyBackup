import { NextRequest, NextResponse } from 'next/server'
import { publishDraftPost } from '../../services/DraftPostService'
import { withBskyLogoutAndErrorHandlingForRequest } from '../../../api-helpers/apiWrapper'
import Logger from '@/app/api-helpers/logger'

const logger = new Logger('SchPostRoute')

// POST handler - wrapped with automatic Bluesky logout
export const POST = withBskyLogoutAndErrorHandlingForRequest(
  async (request: NextRequest) => {
    const { id } = await request.json()
    if (!id) {
      logger.error('Post ID is required')
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    logger.log(`Publishing draft post: ${id}`)
    await publishDraftPost(id)

    return NextResponse.json(
      { message: 'Post sent to all supported platforms' },
      { status: 200 }
    )
  }
)
