import { Session, InternalStateData, Key } from '@atproto/oauth-client'
import { Schedule } from './scheduler'

export interface AppData {
  lastBackup?: string | null
  postsOnBsky?: number | null
  totalPostsBackedUp?: number | null
  oldestBskyPostDate?: string | null
  schedules?: Schedule[] | null
  settings?: Settings | null
  bskySession?: { [key: string]: Session } | null
  bskyState?: { [key: string]: InternalStateData } | null
  oauthKeys?: { RS256: Key; ES256: Key } | null
}

export interface Settings {
  bskyIdentifier?: string
  bskyPassword?: string
  bskyDisplayName?: string
  backupLocation?: string
  pruneAfterMonths?: number
  defaultTimezone?: string
  hasOnboarded: boolean
}

export interface PostMedia {
  url: string
  width: number
  height: number
  size: number
}

export interface PostDisplayData {
  text: string
  author?: {
    displayName?: string
    handle?: string
  }
  indexedAt: string
  likeCount?: number
  replyCount?: number
  repostCount?: number
  images?: PostMedia[]
  isRepost: boolean
  parent?: PostDisplayData
  root?: PostDisplayData
  draftId?: string
  postId?: string
  group?: string
  slug?: string
}
