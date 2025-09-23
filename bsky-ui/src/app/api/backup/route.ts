import { NextRequest, NextResponse } from 'next/server'
import { getBackup, runBackup } from '../services/BackupService'

export async function GET() {
  const backup = await getBackup()
  return NextResponse.json(backup)
}

export async function POST(request: NextRequest) {
  try {
    await runBackup()

    return NextResponse.json({
      success: true,
      message: 'Backup completed successfully',
    })
  } catch (error) {
    console.error('Backup failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Backup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
