import { getSettings, updateSettings } from '../services/SettingsService'
import { NextResponse } from 'next/server'
import Logger from '@/app/api/helpers/logger'

const logger = new Logger('SettingsRoute')

export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    logger.error('Failed to fetch settings', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const {
      bskyDisplayName,
      bskyIdentifier,
      bskyPassword,
      backupLocation,
      hasOnboarded,
    } = data
    const isValid = (str: string) => {
      return typeof str === 'string' && str.trim().length > 0
    }

    if (
      !hasOnboarded &&
      isValid(bskyDisplayName) &&
      isValid(bskyIdentifier) &&
      isValid(bskyPassword) &&
      isValid(backupLocation)
    ) {
      data.hasOnboarded = true
    }

    const updatedSettings = await updateSettings(data)
    return NextResponse.json(updatedSettings)
  } catch (error) {
    logger.error('Failed to update settings', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
