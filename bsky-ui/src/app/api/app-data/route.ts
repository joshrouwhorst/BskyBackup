import { NextResponse } from 'next/server'
import { getAppData } from '../helpers/appData'

export async function GET() {
  try {
    const appData = await getAppData()
    return NextResponse.json(appData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch app data' },
      { status: 500 }
    )
  }
}
