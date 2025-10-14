import { getOAuthClient } from '@/app/api/helpers/bskyClient'

export async function GET() {
  try {
    const client = await getOAuthClient()

    // Return the client metadata JSON
    return Response.json(client.clientMetadata)
  } catch (error) {
    console.error('Error getting client metadata:', error)
    return Response.json(
      { error: 'Failed to get client metadata' },
      { status: 500 }
    )
  }
}
