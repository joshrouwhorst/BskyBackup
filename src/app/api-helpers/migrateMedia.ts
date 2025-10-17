import Logger from './logger'

import {
  getMediaLocation,
  getMediaExtension,
  getMediaName,
  getMediaNameOld,
  getMediaType,
  openBackup,
} from './backupFiles'
import { FeedViewPost, PostView } from '@/types/bsky'
import { checkIfExists, moveFileOrDirectory } from '../api/services/FileService'
import { getPaths } from '@/config/main'
import { AppBskyEmbedImages } from '@atproto/api'

const logger = new Logger('MigrateMedia')

export default async function migrateMedia() {
  logger.opening('Media Migration Process')
  const backupData = await openBackup()
  for (const feedView of backupData) {
    if (feedView.post.embed?.$type === 'app.bsky.embed.images#view') {
      const embed = feedView.post.embed as AppBskyEmbedImages.View
      for (let i = 0; i < embed.images.length; i++) {
        const idx = i
        const img = embed.images[i]
        logger.log(
          `Processing POST ${feedView.post.cid} > IMAGE ${img.fullsize}`
        )
        const year = new Date(feedView.post.indexedAt).getFullYear().toString()
        const extension = getMediaExtension(img.fullsize)
        const oldMediaName = getMediaNameOld(feedView.post, extension, idx)
        const oldMediaPath = await getMediaLocation(
          oldMediaName,
          year,
          extension
        )
        const newMediaName = getMediaName(feedView.post, extension, idx)
        const newMediaPath = await getMediaLocation(
          newMediaName,
          year,
          extension
        )

        const oldMediaExists = await checkIfExists(oldMediaPath)
        if (!oldMediaExists) {
          logger.log(`Old Media ${oldMediaPath} does not exist. Skipping...`)
          continue
        }

        try {
          await moveFileOrDirectory(oldMediaPath, newMediaPath)
          logger.log(`Moved media from ${oldMediaPath} to ${newMediaPath}`)
        } catch (error) {
          logger.error(
            `Error moving media from ${oldMediaPath} to ${newMediaPath}:`,
            error
          )
          continue
        }
      }
    }
  }
  logger.closing('Media Migration Process')
}
