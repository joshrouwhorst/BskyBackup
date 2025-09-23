export const BSKY_IDENTIFIER = process.env.BSKY_IDENTIFIER || ''
export const BSKY_PASSWORD = process.env.BSKY_PASSWORD || ''

export const BSKY_BACKUP_LOCATION = process.env.BSKY_BACKUP_LOCATION || ''
export const DRAFT_POSTS_PATH = `${BSKY_BACKUP_LOCATION}/draft-posts`
export const PUBLISHED_POSTS_PATH = `${BSKY_BACKUP_LOCATION}/published-posts`
export const BACKUP_PATH = `${BSKY_BACKUP_LOCATION}/backup`
export const APP_DATA_FILE = `${BSKY_BACKUP_LOCATION}/app-data.json`
export const LOGS_PATH = `${BSKY_BACKUP_LOCATION}/logs`
export const BACKUP_MEDIA_PATH = `${BACKUP_PATH}/media`
export const POST_BACKUP_FILE = `${BACKUP_PATH}/bluesky-posts.json`

export const DEFAULT_PRUNE_MONTHS = process.env.DEFAULT_PRUNE_MONTHS
  ? parseInt(process.env.DEFAULT_PRUNE_MONTHS, 10)
  : 3
export const MINIMUM_MINUTES_BETWEEN_BACKUPS = 5

export const APP_PORT = process.env.APP_PORT || 3000
export const APP_HOST = process.env.APP_HOST || 'localhost'
export const APP_URL = process.env.APP_URL || `http://${APP_HOST}:${APP_PORT}`

export const DRAFT_MEDIA_ENDPOINT = '/api/drafts/media'
export const BACKUP_MEDIA_ENDPOINT = '/api/backup/images'

export const POSTS_PER_PAGE = 20
export const MAX_POSTS = 1000

export const DATE_FORMAT = 'yyyy-MM-dd'
export const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss'
export const DEFAULT_TIMEZONE = 'America/New_York'
export const HEADER_NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Drafts', href: '/drafts' },
  { label: 'Schedules', href: '/schedules' },
]
