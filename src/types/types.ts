import { Schedule } from './scheduler'

export interface AppData {
  lastBackup?: string | null
  postsOnBsky?: number | null
  totalPostsBackedUp?: number | null
  oldestBskyPostDate?: string | null
  schedules?: Schedule[] | null
  settings?: Settings | null
}

export interface Settings {
  bskyIdentifier?: string
  bskyPassword?: string
  bskyDisplayName?: string
  backupLocation?: string
  pruneAfterMonths?: number
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
}
