import { getOAuthClient } from '@/app/api/helpers/bskyClient'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const client = await getOAuthClient()
    const url = request.nextUrl

    // Complete the OAuth flow
    const { session } = await client.callback(url.searchParams)
    if (!session) {
      throw new Error('No session returned from OAuth callback')
    }

    const redirectUrl = new URL('/', url.origin)
    redirectUrl.searchParams.set('oauth', 'success')

    return Response.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('Error handling OAuth callback:', error)

    // Redirect with error
    const redirectUrl = new URL('/', request.nextUrl.origin)
    redirectUrl.searchParams.set('oauth', 'error')

    return Response.redirect(redirectUrl.toString())
  }
}
