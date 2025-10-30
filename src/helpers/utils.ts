/** biome-ignore-all lint/style/noNonNullAssertion: Easier to set up this way */

import type { PostDisplayData } from '@/components/Post'
import { BACKUP_MEDIA_ENDPOINT } from '@/config/frontend'
import type { PostData } from '@/types/bsky'
import type { DraftPost } from '@/types/drafts'
import dayjs from 'dayjs'

export function getDateTimeObject(date: Date | string): {
  _object: Date
  date: string
  time: string
  day: string
  month: string
  year: string
  hours: string
  minutes: string
  amPm: string
} | null {
  if (!date) return null
  const d = dayjs(date)
  if (!d.isValid()) return null

  return {
    _object: d.toDate(),
    date: d.format('YYYY-MM-DD'),
    time: d.format('h:mm A').toLowerCase(),
    day: d.format('dddd'),
    month: d.format('MMMM'),
    year: d.format('YYYY'),
    hours: d.format('h'),
    minutes: d.format('mm'),
    amPm: d.format('A').toLowerCase(),
  }
}

export function formatDate(date: Date | string): string {
  const obj = getDateTimeObject(date)
  if (!obj) return ''
  return `${obj.date} ${obj.time}`
}

export function formatFullDateTime(date: Date | string): string {
  const obj = getDateTimeObject(date)
  if (!obj) return ''
  return `${obj.day} - ${obj.date} @ ${obj.time}`
}

export function displayTime(time: Date | string): string {
  if (typeof time === 'string') {
    const now = new Date()
    const obj = getDateTimeObject(now)
    const timeObj = getDateTimeObject(`${obj?.date}T${time}Z`)
    return timeObj ? `${timeObj.hours}:${timeObj.minutes} ${timeObj.amPm}` : ''
  }

  const obj = getDateTimeObject(time)
  if (!obj) return ''
  return `${obj.hours}:${obj.minutes} ${obj.amPm}`
}

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getVideoFilePath(postId: string, year: string) {
  return `${BACKUP_MEDIA_ENDPOINT}/${year}/mp4/video-${postId}.mp4`
}

export function getDisplayDataFromPostData(
  postData: PostData
): PostDisplayData {
  const videoObj = {
    url: '',
    width: 0,
    height: 0,
    size: 0,
  }

  const imageList: PostDisplayData['images'] = []

  const record = postData.post.record as {
    embed?: {
      $type: string
      aspectRatio: {
        height: number
        width: number
      }
      video: {
        $type: string
        ref: {
          $link: string
        }
        mimeType: string
        size: number
      }
    }
  }

  if (
    postData.post.embed?.$type === 'app.bsky.embed.images#view' &&
    postData.post.embed.images
  ) {
    postData.post.embed.images.forEach(
      (img: {
        local?: string
        fullsize?: string
        aspectRatio: { width: number; height: number }
      }) => {
        imageList.push({
          url: img.local || img.fullsize || '',
          width: img.aspectRatio.width,
          height: img.aspectRatio.height,
          size: 0, // Size not provided in embed data
        })
      }
    )
  }

  if (record?.embed && record.embed.$type === 'app.bsky.embed.video') {
    videoObj.url =
      getVideoFilePath(
        postData.post.cid || '',
        new Date(postData.post.indexedAt).getFullYear().toString()
      ) || ''
    videoObj.width = record.embed.aspectRatio?.width || videoObj.width
    videoObj.height = record.embed.aspectRatio?.height || videoObj.height
    videoObj.size = 0 // Size not provided in embed data
  }

  return {
    text: postData.post.record?.text || '',
    author: postData.post.author,
    indexedAt: postData.post.indexedAt,
    likeCount: postData.post.likeCount,
    replyCount: postData.post.replyCount,
    repostCount: postData.post.repostCount,
    images: imageList.length === 0 ? undefined : imageList,
    video: videoObj,
    isRepost: !!postData.reason,
    parent: postData.reply?.parent
      ? getDisplayDataFromPostData({ post: postData.reply.parent })
      : undefined,
    root:
      postData.reply?.root &&
      postData.reply.root.uri !== postData.reply.parent?.uri
        ? getDisplayDataFromPostData({ post: postData.reply.root })
        : undefined,
    postId: postData.post?.cid,
  } as PostDisplayData
}

export function getDisplayDataFromDraft(
  draftPost: DraftPost,
  displayName: string,
  handle: string
): PostDisplayData {
  return {
    text: draftPost.meta.text || '',
    author: {
      displayName,
      handle,
    },
    indexedAt: draftPost.meta.createdAt,
    isRepost: false,
    images: draftPost.meta.images.map((img) => ({
      url: img.url!,
      width: img.width,
      height: img.height,
      size: img.size,
    })),
    video: draftPost.meta.video
      ? {
          url: draftPost.meta.video.url!,
          width: draftPost.meta.video.width,
          height: draftPost.meta.video.height,
          size: draftPost.meta.video.size,
        }
      : undefined,
    draftId: draftPost.meta.directoryName,
    group: draftPost.group,
    slug: draftPost.meta.slug,
  } as PostDisplayData
}
