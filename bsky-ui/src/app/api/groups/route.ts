import { NextResponse } from 'next/server'
import { getGroups } from '../services/DraftPostService'

export async function GET(request: Request) {
  try {
    const groups = await getGroups()
    if (!groups || !Array.isArray(groups)) {
      return NextResponse.json({ error: 'Groups not found' }, { status: 404 })
    }
    return NextResponse.json(groups)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch groups',
      },
      { status: 500 }
    )
  }
}
