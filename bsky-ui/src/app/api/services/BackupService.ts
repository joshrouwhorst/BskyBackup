import {
  backupMediaFiles,
  openBackup,
  saveBackup,
} from '@/app/api/helpers/backupFiles'
import { getPosts, deletePosts } from '@/app/api/helpers/bluesky'
import { PostData } from '@/types/bsky'
import { transformFeedViewPostToPostData } from '@/app/api/helpers/transformFeedViewPostToPostData'
import { DEFAULT_PRUNE_MONTHS, MINIMUM_MINUTES_BETWEEN_BACKUPS } from '@/config'
import Logger from '@/app/api/helpers/logger'
import { formatDate } from '@/helpers/utils'
import { getAppData, saveAppData } from '../helpers/appData'

init()
function init() {
  Logger.log('BackupService initialized.')
}

export async function getBackup(): Promise<PostData[]> {
  const posts = await openBackup()
  return posts.map(transformFeedViewPostToPostData)
}

export async function runBackup() {
  Logger.opening('Backup Process')
  Logger.log('Getting appData.')
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
    Logger.log(
      `Last backup at ${formatDate(
        lastBackup
      )} was less than ${MINIMUM_MINUTES_BETWEEN_BACKUPS} minutes ago. Skipping backup.`
    )
    Logger.closing('Backup Process')
    return []
  } else if (lastBackup) {
    Logger.log(`Last backup was on ${formatDate(lastBackup)}.`)
  } else {
    Logger.log('No previous backup found.')
  }

  // Load existing backup posts

  const backupPosts = await openBackup()

  Logger.log(`There are ${backupPosts.length} existing posts in backup.`)

  // Get all posts from Bluesky
  const newPosts = await getPosts()
  if (newPosts.length === 0) {
    Logger.log('We received no posts from Bluesky.')
    Logger.closing('Backup Process')
    return
  }

  Logger.log(`There are ${newPosts.length} posts from Bluesky.`)

  // Update existing posts with new ones, avoiding duplicates
  const existingPostsMap = new Map(
    backupPosts.map((post) => [post.post.cid, post])
  )

  let newMediaCount = 0
  newPosts.forEach(async (post) => {
    newMediaCount += await backupMediaFiles(post)
  })

  Logger.log(`There are ${newMediaCount} new media files backed up.`)

  // Add new posts, replacing existing ones with same CID
  newPosts.forEach((newPost) => {
    existingPostsMap.set(newPost.post.cid, newPost)
  })

  const combinedPosts = Array.from(existingPostsMap.values())
  await saveBackup(combinedPosts)

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

  await saveAppData(appData)
  Logger.log(
    `Backup complete. There are now ${combinedPosts.length} total posts in backup.`
  )
  Logger.closing('Backup Process')
  return combinedPosts.map(transformFeedViewPostToPostData)
}

export async function prunePosts(): Promise<void> {
  Logger.opening('Prune Process')

  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - DEFAULT_PRUNE_MONTHS)
  if (isNaN(cutoffDate.getTime())) {
    Logger.log('Invalid cutoff date calculated.')
    Logger.closing('Prune Process')
    throw new Error('Cutoff date is required')
  }

  // Do not allow deleting data newer than 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  if (cutoffDate > threeMonthsAgo) {
    Logger.log(
      `Cutoff date ${formatDate(cutoffDate)} is more recent than 3 months ago.`
    )
    Logger.closing('Prune Process')
    throw new Error(`Cutoff date cannot be more recent than 3 months ago`)
  }

  Logger.log(`Running backup before pruning.`)
  await runBackup() // Ensure we have the latest posts before pruning

  Logger.log(`Pruning posts older than ${formatDate(cutoffDate)}.`)
  await deletePosts({ cutoffDate })

  Logger.log(`Prune process complete.`)
  const currentPosts = await getPosts()

  Logger.log(`There are now ${currentPosts.length} total posts in on Bluesky.`)
  Logger.closing('Prune Process')
  return
}
