import { getAppData, saveAppData } from '../helpers/appData'
import Logger from '../helpers/logger'
import { Settings } from '@/types/types'

const logger = new Logger('SettgServ')

const defaults: Settings = {
  bskyDisplayName: '',
  bskyIdentifier: '',
  bskyPassword: '',
  backupLocation: '',
  pruneAfterMonths: 6,
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
