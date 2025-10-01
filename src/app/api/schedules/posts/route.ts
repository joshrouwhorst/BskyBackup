import { NextRequest, NextResponse } from 'next/server'
import { publishDraftPost } from '../../services/DraftPostService'
import Logger from '@/app/api/helpers/logger'

const logger = new Logger('SchPostRoute')

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) {
      logger.error('Post ID is required')
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    await publishDraftPost(id)
    return NextResponse.json(
      { message: 'Post sent to all supported platforms' },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Failed to send post to social platform', error)
    return NextResponse.json(
      { error: 'Failed to send post to social platform' },
      { status: 500 }
    )
  }
}
