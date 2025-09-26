import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const SRC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const APP_DATA_FILE = `${SRC_DIR}/app-data/app-data`
export const LOGS_PATH = `${SRC_DIR}/logs`
export const APP_DATA_ENCRYPTION_KEY =
  process.env.APP_DATA_ENCRYPTION_KEY || 'default_secret_key_32bytes!' // Must be 32 bytes

export const APP_PORT = process.env.APP_PORT || 3000
export const APP_HOST = process.env.APP_HOST || 'localhost'
export const APP_URL = process.env.APP_URL || `http://${APP_HOST}:${APP_PORT}`
