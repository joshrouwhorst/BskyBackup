import path from 'path'
import { FeedViewPost } from '@/types/bsky'
import { POST_BACKUP_FILE, BACKUP_MEDIA_PATH } from '@/config'
import { saveJsonToFile, readJsonFromFile, downloadFile } from './utils'

export async function openBackup(): Promise<FeedViewPost[]> {
  try {
    return (await readJsonFromFile<FeedViewPost[]>(POST_BACKUP_FILE)) || []
  } catch (error) {
    console.error(`Error reading backup file ${POST_BACKUP_FILE}:`, error)
    return []
  }
}

export async function saveBackup(data: FeedViewPost[]): Promise<void> {
  // Sort newest to oldest
  data.sort((a, b) => {
    return (
      new Date(b.post.indexedAt).getTime() -
      new Date(a.post.indexedAt).getTime()
    )
  })

  await saveJsonToFile(data, POST_BACKUP_FILE)
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
      const mediaLocation = getMediaLocation(mediaFilename, year, mediaType)

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

export function getMediaLocation(
  mediaName: string,
  year: string,
  mediaType: string
) {
  return path.join(BACKUP_MEDIA_PATH, year, mediaType, mediaName)
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
