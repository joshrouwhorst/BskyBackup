import { getOAuthClient } from '@/app/api/helpers/bskyClient'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const client = await getOAuthClient()

    // Get the authorization URL and state from the OAuth client
    const handle = request.nextUrl.searchParams.get('handle')

    if (!handle) {
      return Response.json(
        { error: 'Handle parameter is required' },
        { status: 400 }
      )
    }

    // Create authorization URL
    const authUrl = await client.authorize(handle, {
      scope: 'atproto transition:generic',
    })

    // Redirect to the authorization URL
    return Response.redirect(authUrl.toString())
  } catch (error) {
    console.error('Error starting OAuth flow:', error)
    return Response.json(
      { error: 'Failed to start OAuth flow' },
      { status: 500 }
    )
  }
}
