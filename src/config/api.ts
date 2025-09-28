import { getSettings } from '../app/api/services/SettingsService'
const settings = await getSettings()

export const DEFAULT_GROUP = 'default' // in all 3 config files
export const DEFAULT_POST_SLUG = 'draft'
export const BSKY_DISPLAY_NAME = settings?.bskyDisplayName || ''
export const BSKY_IDENTIFIER = settings?.bskyIdentifier || ''
export const BSKY_PASSWORD = settings?.bskyPassword || ''

export const MAIN_BACKUP_LOCATION = settings?.backupLocation || ''
export const DRAFT_POSTS_PATH = `${MAIN_BACKUP_LOCATION}/draft-posts`
export const PUBLISHED_POSTS_PATH = `${MAIN_BACKUP_LOCATION}/published-posts`
export const BACKUP_PATH = `${MAIN_BACKUP_LOCATION}/backup`
export const BACKUP_MEDIA_PATH = `${BACKUP_PATH}/media`
export const POST_BACKUP_FILE = `${BACKUP_PATH}/bluesky-posts.json`

export const DEFAULT_PRUNE_MONTHS = settings?.pruneAfterMonths || 3
export const MINIMUM_MINUTES_BETWEEN_BACKUPS = 5

export const DRAFT_MEDIA_ENDPOINT = '/api/drafts/media'
export const BACKUP_MEDIA_ENDPOINT = '/api/backup/images'
export const SUPPORTED_SOCIAL_PLATFORMS = ['bluesky'] as const

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

export const CRON_FREQUENCY_MINUTES = 5 // how often to check for scheduled posts
