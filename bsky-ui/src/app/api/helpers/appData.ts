import { APP_DATA_FILE } from '@/config'
import fs from 'fs'

import { AppData } from '@/types/types'
import Logger from './logger'

export async function getAppData(): Promise<AppData> {
  if (!fs.existsSync(APP_DATA_FILE)) {
    return { lastBackup: null, postsOnBsky: 0, totalPostsBackedUp: 0 }
  }
  const data = await fs.promises.readFile(APP_DATA_FILE, 'utf-8')
  return JSON.parse(data)
}

export async function saveAppData(data: AppData): Promise<void> {
  Logger.log('Saving app data.')
  await fs.promises.writeFile(APP_DATA_FILE, JSON.stringify(data))
}
