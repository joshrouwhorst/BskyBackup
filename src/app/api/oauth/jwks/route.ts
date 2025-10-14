import { getOAuthClient } from '@/app/api/helpers/bskyClient'

export async function GET() {
  try {
    const client = await getOAuthClient()

    // Return the JWKS (JSON Web Key Set)
    return Response.json(client.jwks)
  } catch (error) {
    console.error('Error getting JWKS:', error)
    return Response.json({ error: 'Failed to get JWKS' }, { status: 500 })
  }
}
