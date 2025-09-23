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

export async function getBackup(): Promise<PostData[]> {
  const posts = await openBackup()
  return posts.map(transformFeedViewPostToPostData)
}

export async function runBackup() {
  const logger = new Logger()
  logger.log('Starting the backup process.')
  const appData = await getAppData()

  // Make sure we respect minimum time between backups
  if (
    appData &&
    appData.lastBackup &&
    !isNaN(new Date(appData.lastBackup).getTime()) &&
    new Date(appData.lastBackup).getTime() <
      Date.now() - MINIMUM_MINUTES_BETWEEN_BACKUPS * 60 * 1000
  ) {
    logger.log(
      `Last backup at ${formatDate(
        appData.lastBackup
      )} was too recent. Skipping backup.`
    )
  } else if (appData && appData.lastBackup) {
    logger.log(`Last backup was on ${formatDate(appData.lastBackup)}.`)
  } else {
    logger.log('No previous backup found.')
  }

  // Load existing backup posts

  const backupPosts = await openBackup()

  logger.log(`There are ${backupPosts.length} existing posts in backup.`)

  // Get all posts from Bluesky
  const newPosts = await getPosts()
  if (newPosts.length === 0) {
    logger.log('We received no posts from Bluesky.')
    return
  }

  logger.log(`There are ${newPosts.length} posts from Bluesky.`)

  // Update existing posts with new ones, avoiding duplicates
  const existingPostsMap = new Map(
    backupPosts.map((post) => [post.post.cid, post])
  )

  let newMediaCount = 0
  newPosts.forEach(async (post) => {
    newMediaCount += await backupMediaFiles(post)
  })

  logger.log(`There are ${newMediaCount} new media files backed up.`)

  // Add new posts, replacing existing ones with same CID
  newPosts.forEach((newPost) => {
    existingPostsMap.set(newPost.post.cid, newPost)
  })

  const combinedPosts = Array.from(existingPostsMap.values())
  await saveBackup(combinedPosts)
  logger.log(
    `Backup complete. There are now ${combinedPosts.length} total posts in backup.`
  )
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
  await logger.save()
  return combinedPosts.map(transformFeedViewPostToPostData)
}

export async function prunePosts(): Promise<void> {
  const logger = new Logger()
  logger.log('Starting the prune process.')

  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - DEFAULT_PRUNE_MONTHS)
  if (isNaN(cutoffDate.getTime())) {
    throw new Error('Cutoff date is required')
  }

  // Do not allow deleting data newer than 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  if (cutoffDate > threeMonthsAgo) {
    throw new Error(`Cutoff date cannot be more recent than 3 months ago`)
  }

  logger.log(`Running backup before pruning.`)
  await runBackup() // Ensure we have the latest posts before pruning

  logger.log(`Pruning posts older than ${formatDate(cutoffDate)}.`)
  await deletePosts({ cutoffDate })

  logger.log(`Prune process complete.`)
  const currentPosts = await getPosts()

  logger.log(`There are now ${currentPosts.length} total posts in on Bluesky.`)
  await logger.save()

  return
}
