import { APP_DATA_FILE, ENCRYPTION_KEY } from '@/config/main'
import fs from 'fs'
import path from 'path'

import type { AppData } from '@/types/types'
import Logger from './logger'
import crypto from 'crypto'
import { ensureDir } from './utils'
const logger = new Logger('AppData')

const IV_LENGTH = 16

let _cache: AppData | null = null
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes
let _lastCacheTime = 0

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv
  )
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return iv.toString('base64') + ':' + encrypted
}

function decrypt(text: string): string {
  const [ivBase64, encryptedData] = text.split(':')
  const iv = Buffer.from(ivBase64, 'base64')
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv
  )
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export async function getAppData(): Promise<AppData> {
  if (_cache && Date.now() - _lastCacheTime < CACHE_DURATION_MS) return _cache
  await ensureDir(path.dirname(APP_DATA_FILE))
  if (!fs.existsSync(APP_DATA_FILE)) {
    return { lastBackup: null, postsOnBsky: 0, totalPostsBackedUp: 0 }
  }
  const encrypted = await fs.promises.readFile(APP_DATA_FILE, 'utf-8')
  const data = decrypt(encrypted)
  const appData = JSON.parse(data) as AppData
  _cache = appData
  _lastCacheTime = Date.now()
  return appData
}

export async function saveAppData(data: AppData): Promise<void> {
  logger.log('Saving app data.')
  await ensureDir(path.dirname(APP_DATA_FILE))
  _cache = data
  _lastCacheTime = Date.now()
  const json = JSON.stringify(data)
  const encrypted = encrypt(json)
  await fs.promises.writeFile(APP_DATA_FILE, encrypted)
}
