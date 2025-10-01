import path from 'path'
import { FeedViewPost } from '@/types/bsky'
import { saveJsonToFile, readJsonFromFile, downloadFile } from './utils'
import { getPaths } from '@/config/main'
import Logger from './logger'

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

export async function backupMediaFiles(post: FeedViewPost): Promise<number> {
  let _fileWriteCount = 0
  if (
    post.post.embed &&
    post.post.embed.$type === 'app.bsky.embed.images#view'
  ) {
    const embed = post.post.embed as any
    if (!embed.images || embed.images.length === 0) {
      return 0
    }
    for (let i = 0; i < embed.images.length; i++) {
      const image = embed.images[i]
      const imageUrl = image.fullsize
      // Extract file extension from the URL after @ symbol, or default to .jpg
      const mediaType = getMediaType(imageUrl)
      const mediaFilename = getMediaName(post.post, imageUrl, i)
      const postDate = new Date(post.post.indexedAt)
      const year = postDate.getFullYear().toString()
      const mediaLocation = await getMediaLocation(
        mediaFilename,
        year,
        mediaType
      )

      const write = await downloadFile({
        url: imageUrl,
        filePath: mediaLocation,
        overwrite: false,
      })

      if (write) {
        _fileWriteCount++
      }
    }
  }
  return _fileWriteCount
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
  fullsizeUrl: string,
  index: number
): string {
  const mediaType = getMediaType(fullsizeUrl)
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
