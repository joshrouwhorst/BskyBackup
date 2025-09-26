import { NextRequest, NextResponse } from 'next/server'
import {
  sendToSocialPlatform,
  getDraftPost,
} from '../../services/DraftPostService'
import { SUPPORTED_SOCIAL_PLATFORMS } from '@/config/main'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }
    const post = await getDraftPost(id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    for (const platform of SUPPORTED_SOCIAL_PLATFORMS) {
      await sendToSocialPlatform(post, platform)
    }
    return NextResponse.json(
      { message: 'Post sent to all supported platforms' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send post to social platform' },
      { status: 500 }
    )
  }
}
