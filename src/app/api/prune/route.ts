import { NextRequest, NextResponse } from 'next/server'
import { prunePosts } from '../services/BackupService'

export async function POST(request: NextRequest) {
  try {
    await prunePosts()

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
