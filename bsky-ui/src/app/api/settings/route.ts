import { getSettings, updateSettings } from '../services/SettingsService'
import { NextResponse } from 'next/server'

export async function GET() {
  const settings = await getSettings()
  return NextResponse.json(settings)
}

export async function PUT(request: Request) {
  const data = await request.json()
  const {
    bskyDisplayName,
    bskyIdentifier,
    bskyPassword,
    backupLocation,
    pruneAfterMonths,
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
}
