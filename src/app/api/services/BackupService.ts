import {
  backupMediaFiles,
  openBackup,
  saveBackup,
} from '@/app/api/helpers/backupFiles'
import { getPosts, deletePosts } from '@/app/api/helpers/bluesky'
import { FeedViewPost, PostData } from '@/types/bsky'
import { transformFeedViewPostToPostData } from '@/app/api/helpers/transformFeedViewPostToPostData'
import { MINIMUM_MINUTES_BETWEEN_BACKUPS } from '@/config/main'
import Logger from '@/app/api/helpers/logger'
import { formatDate } from '@/helpers/utils'
import { getAppData, saveAppData } from '../helpers/appData'
import { getSettings } from './SettingsService'

const logger = new Logger('BackupServ')

init()
function init() {
  logger.log('BackupService initialized.')
}

export async function getBackup(): Promise<PostData[]> {
  const posts = await openBackup()
  return posts.map(transformFeedViewPostToPostData)
}

export async function runBackup() {
  logger.opening('Backup Process')
  logger.log('Getting appData.')
  const appData = await getAppData()
  const lastBackup = appData?.lastBackup ? new Date(appData.lastBackup) : null
  const minimumNextBackup =
    Date.now() - MINIMUM_MINUTES_BETWEEN_BACKUPS * 60 * 1000

  // Make sure we respect minimum time between backups
  if (
    lastBackup &&
    !isNaN(lastBackup.getTime()) &&
    lastBackup.getTime() > minimumNextBackup
  ) {
    logger.log(
      `Last backup at ${formatDate(
        lastBackup
      )} was less than ${MINIMUM_MINUTES_BETWEEN_BACKUPS} minutes ago. Skipping backup.`
    )
    logger.closing('Backup Process')
    return []
  } else if (lastBackup) {
    logger.log(`Last backup was on ${formatDate(lastBackup)}.`)
  } else {
    logger.log('No previous backup found.')
  }

  // Load existing backup posts

  const backupPosts = await openBackup()

  logger.log(`There are ${backupPosts.length} existing posts in backup.`)

  let newPosts: FeedViewPost[] = []
  try {
    // Get all posts from Bluesky
    newPosts = await getPosts()
  } catch (error) {
    logger.error('Error getting posts from Bluesky:', error)
  }

  if (newPosts.length === 0) {
    logger.log('We received no posts from Bluesky.')
    logger.closing('Backup Process')
    return
  }

  logger.log(`There are ${newPosts.length} posts from Bluesky.`)

  // Update existing posts with new ones, avoiding duplicates
  const existingPostsMap = new Map(
    backupPosts.map((post) => [post.post.cid, post])
  )

  let newMediaCount = 0
  newPosts.forEach(async (post) => {
    try {
      newMediaCount += await backupMediaFiles(post)
    } catch (error) {
      logger.error(
        `Error backing up media files for post: ${post.post.cid}`,
        error
      )
    }
  })

  logger.log(`There are ${newMediaCount} new media files backed up.`)

  // Add new posts, replacing existing ones with same CID
  newPosts.forEach((newPost) => {
    existingPostsMap.set(newPost.post.cid, newPost)
  })

  const combinedPosts = Array.from(existingPostsMap.values())
  try {
    await saveBackup(combinedPosts)
  } catch (error) {
    logger.error('Error saving backup:', error)
    throw new Error('Failed to save backup')
  }

  appData.lastBackup = new Date().toISOString()
  appData.postsOnBsky = newPosts.length
  appData.totalPostsBackedUp = combinedPosts.length

  if (newPosts.length > 0) {
    const oldestPost = newPosts.reduce((oldest, post) => {
      const postDate = new Date(post.post.indexedAt)
      return postDate < new Date(oldest.post.indexedAt) ? post : oldest
    }, newPosts[0])
    appData.oldestBskyPostDate = oldestPost.post.indexedAt
  } else {
    appData.oldestBskyPostDate = null
  }

  try {
    await saveAppData(appData)
  } catch (error) {
    logger.error('Error saving appData:', error)
  }

  logger.log(
    `Backup complete. There are now ${combinedPosts.length} total posts in backup.`
  )
  logger.closing('Backup Process')
  return combinedPosts.map(transformFeedViewPostToPostData)
}

export async function prunePosts(): Promise<void> {
  logger.opening('Prune Process')
  const settings = await getSettings()
  if (!settings.pruneAfterMonths || settings.pruneAfterMonths < 1) {
    logger.log(
      'Pruning is disabled (pruneAfterMonths is not set or less than 1). Exiting prune process.'
    )
    logger.closing('Prune Process')
    return
  }

  if (settings.pruneAfterMonths < 3) {
    logger.log(
      `Pruning period is set to ${settings.pruneAfterMonths} months, which is less than the minimum of 3 months. Adjusting to 3 months.`
    )
    settings.pruneAfterMonths = 3
  }

  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - settings.pruneAfterMonths)
  if (isNaN(cutoffDate.getTime())) {
    logger.log('Invalid cutoff date calculated.')
    logger.closing('Prune Process')
    throw new Error('Cutoff date is required')
  }

  // Do not allow deleting data newer than 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  if (cutoffDate > threeMonthsAgo) {
    logger.log(
      `Cutoff date ${formatDate(cutoffDate)} is more recent than 3 months ago.`
    )
    logger.closing('Prune Process')
    throw new Error(`Cutoff date cannot be more recent than 3 months ago`)
  }

  logger.log(`Running backup before pruning.`)
  await runBackup() // Ensure we have the latest posts before pruning

  logger.log(`Pruning posts older than ${formatDate(cutoffDate)}.`)
  await deletePosts({ cutoffDate })

  logger.log(`Prune process complete.`)
  const currentPosts = await getPosts()

  logger.log(`There are now ${currentPosts.length} total posts in on Bluesky.`)
  logger.closing('Prune Process')
  return
}
