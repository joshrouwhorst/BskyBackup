import { getAppData, saveAppData } from '../../api-helpers/appData'
import Logger from '../../api-helpers/logger'
import { Settings } from '@/types/types'
import {
  BSKY_IDENTIFIER,
  BSKY_DISPLAY_NAME,
  BSKY_PASSWORD,
  DEFAULT_PRUNE_MONTHS,
  DATA_LOCATION,
} from '@/config/main'

const logger = new Logger('SettgServ')

const defaults: Settings = {
  bskyDisplayName: BSKY_DISPLAY_NAME || '',
  bskyIdentifier: BSKY_IDENTIFIER || '',
  bskyPassword: BSKY_PASSWORD || '',
  backupLocation: DATA_LOCATION || '',
  pruneAfterMonths: DEFAULT_PRUNE_MONTHS ? Number(DEFAULT_PRUNE_MONTHS) : 3,
  autoBackupFrequencyMinutes: undefined,
  hasOnboarded: false,
}

init()
function init() {
  logger.log('SettingsService initialized.')
}

export async function getSettings(): Promise<Settings> {
  const appData = await getAppData()
  return appData.settings || defaults
}

export async function updateSettings(
  settings: Partial<Settings>
): Promise<Settings> {
  logger.log(`Updating settings.`, settings)
  const appData = await getAppData()

  appData.settings = {
    ...appData.settings,
    ...settings,
    hasOnboarded:
      settings.hasOnboarded ??
      appData.settings?.hasOnboarded ??
      defaults.hasOnboarded,
  }

  await saveAppData(appData)

  return getSettings()
}
