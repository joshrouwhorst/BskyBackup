import path from 'path'
import { FeedViewPost } from '@/types/bsky'
import { saveBlobToFile } from './bluesky'
import { saveJsonToFile, readJsonFromFile, downloadFile } from './utils'
import { getPaths } from '@/config/main'
import Logger from './logger'
import { checkIfExists } from '../api/services/FileService'
import { AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api'

const logger = new Logger('BackupFile')

export async function openBackup(): Promise<FeedViewPost[]> {
  // Ensure backup directory exists
  const { postBackupFile } = await getPaths()
  try {
    return (await readJsonFromFile<FeedViewPost[]>(postBackupFile)) || []
  } catch (error) {
    logger.error(`Error reading backup file ${postBackupFile}:`, error)
    return []
  }
}

export async function saveBackup(data: FeedViewPost[]): Promise<void> {
  const { postBackupFile } = await getPaths()
  // Sort newest to oldest
  data.sort((a, b) => {
    return (
      new Date(b.post.indexedAt).getTime() -
      new Date(a.post.indexedAt).getTime()
    )
  })

  await saveJsonToFile(data, postBackupFile)
}

export async function backupMediaFiles(
  feedViewPost: FeedViewPost
): Promise<number> {
  const post = feedViewPost.post
  const record = post.record

  if (post.embed && post.embed.$type === 'app.bsky.embed.images#view') {
    let _fileWriteCount = 0
    const embed = post.embed as any
    if (!embed.images || embed.images.length === 0) {
      return 0
    }
    for (let i = 0; i < embed.images.length; i++) {
      const image = embed.images[i]
      const imageUrl = image.fullsize
      // Extract file extension from the URL after @ symbol, or default to .jpg
      const mediaType = getMediaType(imageUrl)
      const mediaFilename = getMediaName(post, mediaType, i)
      const postDate = new Date(post.indexedAt)
      const year = postDate.getFullYear().toString()
      const mediaLocation = await getMediaLocation(
        mediaFilename,
        year,
        mediaType
      )

      try {
        const write = await downloadFile({
          url: imageUrl,
          filePath: mediaLocation,
          overwrite: false,
        })
        if (write) {
          _fileWriteCount++
        }
      } catch (err) {
        logger.error(
          `Error downloading image ${imageUrl} to ${mediaLocation}:`,
          err
        )
      }
    }

    return _fileWriteCount
  }

  if (!post.embed || post.embed.$type !== 'app.bsky.embed.video#view') {
    return 0
  }

  // Handle videos
  const embedView = post.embed as AppBskyEmbedVideo.View
  const embed = record.embed as AppBskyEmbedVideo.Main

  if (!embed?.video) {
    return 0
  }

  const write = await saveBlobData(
    embed.video,
    `video-${post.cid}`,
    embedView.cid,
    post.author.did
  )

  if (write) return 1

  return 0
}

export function getMediaType(imageUrl: string): string {
  const atIndex = imageUrl.lastIndexOf('@')
  return imageUrl.substring(atIndex + 1)
}

export async function getMediaLocation(
  mediaName: string,
  year: string,
  mediaType: string
) {
  const { backupMediaPath } = await getPaths()
  return path.join(backupMediaPath, year, mediaType, mediaName)
}

export function getMediaPath(
  mediaName: string,
  year: string,
  mediaType: string
) {
  return path.join('/api/images', year, mediaType, mediaName)
}

export function getMediaName(
  post: FeedViewPost['post'],
  mediaType: string,
  index: number
): string {
  // Extract file extension from the URL after @ symbol, or default to .jpg
  const mediaExtension = mediaType ? `.${mediaType}` : '.jpg'
  const postDate = new Date(post.indexedAt)
  const year = postDate.getFullYear()
  const month = String(postDate.getMonth() + 1).padStart(2, '0')
  const day = String(postDate.getDate()).padStart(2, '0')
  const hour = String(postDate.getHours()).padStart(2, '0')
  const minute = String(postDate.getMinutes()).padStart(2, '0')
  const second = String(postDate.getSeconds()).padStart(2, '0')
  const dateString = `${year}${month}${day}_${hour}${minute}${second}`
  const mediaFilename = `${dateString}_${mediaType}_${index}${mediaExtension}`
  return mediaFilename
}

/**
 * Save blob data to filesystem using AT Protocol blob reference
 * Supports both images and videos
 * @param mediaBlob - The blob object from AT Protocol (image or video)
 * @param filename - The filename to save as
 * @param cid - The CID of the blob
 * @param userDid - The DID of the user who owns the blob
 * @returns Promise<boolean> - true if successful
 *
 * Usage examples:
 * const success = await saveBlobData(imageBlob, 'my-image.jpg', 'did:plc:example123')
 * const success = await saveBlobData(videoBlob, 'my-video.mp4', 'did:plc:example123')
 */
export async function saveBlobData(
  mediaBlob: {
    ref: {
      bytes?: Uint8Array
      $link?: string
    }
    mimeType: string
    size: number
  },
  filename: string,
  cid: string,
  userDid: string
): Promise<boolean> {
  try {
    // Get the media extension from mime type
    const extension = getExtensionFromMimeType(mediaBlob.mimeType)

    // Create full filename with extension if not provided
    const fullFilename = filename.includes('.')
      ? filename
      : `${filename}.${extension}`

    // Get media storage location
    const postDate = new Date()
    const year = postDate.getFullYear().toString()
    const mediaLocation = await getMediaLocation(fullFilename, year, extension)

    // If the file already exists, skip saving
    const fileExists = await checkIfExists(mediaLocation)
    if (fileExists) return false

    // Use the blob save function from bluesky.ts
    const success = await saveBlobToFile(cid, mediaLocation, userDid)

    if (success) {
      const mediaType = mediaBlob.mimeType.startsWith('video/')
        ? 'video'
        : 'image'
      logger.log(`Successfully saved ${mediaType} blob to: ${mediaLocation}`)
    } else {
      logger.error(`Failed to save blob to: ${mediaLocation}`)
    }

    return success
  } catch (error) {
    logger.error('Error in saveBlobData:', error)
    return false
  }
}

/**
 * Get file extension from MIME type, with support for common video formats
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExtension: Record<string, string> = {
    // Image formats
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',

    // Video formats
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'video/avi': 'avi',
    'video/mov': 'mov',
    'video/wmv': 'wmv',
    'video/flv': 'flv',
    'video/3gp': '3gp',
    'video/mkv': 'mkv',
    'video/quicktime': 'mov',

    // Audio formats (in case AT Protocol supports them)
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/aac': 'aac',
  }

  // Try exact match first
  const exactMatch = mimeToExtension[mimeType.toLowerCase()]
  if (exactMatch) {
    return exactMatch
  }

  // Fall back to extracting from mime type
  const parts = mimeType.split('/')
  if (parts.length === 2) {
    return parts[1].toLowerCase()
  }

  // Default fallback based on type
  if (mimeType.startsWith('video/')) {
    return 'mp4'
  } else if (mimeType.startsWith('audio/')) {
    return 'mp3'
  } else {
    return 'jpg'
  }
}
