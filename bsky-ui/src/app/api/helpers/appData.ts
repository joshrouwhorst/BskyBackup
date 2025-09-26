import { APP_DATA_FILE, APP_DATA_ENCRYPTION_KEY } from '@/config/main'
import fs from 'fs'
import path from 'path'

import { AppData } from '@/types/types'
import Logger from './logger'
import crypto from 'crypto'
import { ensureDir } from './utils'
const logger = new Logger('AppData')

const ENCRYPTION_KEY = APP_DATA_ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32) // Must be 32 bytes
const IV_LENGTH = 16

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
  await ensureDir(path.dirname(APP_DATA_FILE))
  if (!fs.existsSync(APP_DATA_FILE)) {
    return { lastBackup: null, postsOnBsky: 0, totalPostsBackedUp: 0 }
  }
  const encrypted = await fs.promises.readFile(APP_DATA_FILE, 'utf-8')
  const data = decrypt(encrypted)
  return JSON.parse(data)
}

export async function saveAppData(data: AppData): Promise<void> {
  logger.log('Saving app data.')
  await ensureDir(path.dirname(APP_DATA_FILE))
  const json = JSON.stringify(data)
  const encrypted = encrypt(json)
  await fs.promises.writeFile(APP_DATA_FILE, encrypted)
}
