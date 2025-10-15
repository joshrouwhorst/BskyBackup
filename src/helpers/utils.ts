import { PostDisplayData } from '@/components/Post'
import { BACKUP_MEDIA_ENDPOINT } from '@/config/frontend'
import { DraftPost } from '@/types/drafts'
import { PostData } from '@/types/bsky'

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  return date.toISOString().replace('T', ' ').split('.')[0]
}

export function formatFullDateTime(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  const d = typeof date === 'string' ? new Date(date) : date
  const dayName = days[d.getDay()]
  const dateStr = d.toISOString().split('T')[0]
  const timeStr = d
    .toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
  return `${dayName} - ${dateStr} @ ${timeStr}`
}

export function displayTime(date: Date | string): string {
  if (typeof date === 'string') {
    // Handle time-only format like '13:00'
    if (date.includes(':') && !date.includes('T') && !date.includes(' ')) {
      const today = new Date()
      const [hours, minutes] = date.split(':').map(Number)
      today.setHours(hours, minutes, 0, 0)
      date = today
    } else {
      date = new Date(date)
    }
  }

  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
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
    images: postData.post.embed?.images
      ? postData.post.embed.images.map((img: any) => ({
          url: img.local || img.fullsize,
          width: img.aspectRatio.width,
          height: img.aspectRatio.height,
          size: 0, // Size not provided in embed data
        }))
      : undefined,
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
