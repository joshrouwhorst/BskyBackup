import { NextRequest } from 'next/server'
import { getOAuthClient } from '@/app/api/helpers/bskyClient'

export async function GET(request: NextRequest) {
  try {
    // For now, we'll check if user credentials exist in settings
    // In a full OAuth implementation, you'd check for valid session tokens

    // Simple check: see if user has valid Bluesky credentials
    // This is a placeholder - replace with proper session management

    const authHeader = request.headers.get('authorization')
    const sessionCookie = request.cookies.get('session')?.value

    // For development: check if user settings exist
    // In production: check OAuth session tokens

    if (sessionCookie || authHeader) {
      // TODO: Validate the session/token properly
      return Response.json({
        authenticated: true,
        user: {
          handle: 'user.bsky.social', // Get from session
          name: 'User Name',
        },
      })
    }

    return Response.json({
      authenticated: false,
    })
  } catch (error) {
    console.error('Error checking auth status:', error)
    return Response.json(
      {
        authenticated: false,
        error: 'Failed to check authentication status',
      },
      { status: 500 }
    )
  }
}
