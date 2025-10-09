/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
'use client'

import React from 'react'
import { PostData, ReplyData } from '@/types/bsky'
import { DraftPost } from '@/types/drafts'
import {
  Heart,
  MessageCircle,
  Repeat2,
  Copy,
  Reply,
  Edit,
  Trash,
  Folder,
  CopyPlus,
  CloudUpload,
  FolderPen,
} from 'lucide-react'
import { PostDisplayData } from '@/types/types'
import PostMediaCarousel from './PostMediaCarousel'
import { Button, LinkButton } from './ui/forms'
import { useDraftContext } from '@/providers/DraftsProvider'
import Image from 'next/image'
import { useSettingsContext } from '@/providers/SettingsProvider'

let BSKY_DISPLAY_NAME = 'Your Display Name' // TODO: Get this from app data
let BSKY_IDENTIFIER = 'yourusername.bsky.social'

interface PostProps {
  variant?: 'full' | 'compact'
  postData?: PostData
  draftPost?: DraftPost
  displayData?: PostDisplayData
}

function getEditLink(draftId: string) {
  return `/drafts/${draftId}`
}

function getDisplayDataFromPostData(postData: PostData): PostDisplayData {
  return {
    text: postData.post.record?.text || '',
    author: postData.post.author,
    indexedAt: postData.post.indexedAt,
    likeCount: postData.post.likeCount,
    replyCount: postData.post.replyCount,
    repostCount: postData.post.repostCount,
    images: postData.post.embed?.images
      ? postData.post.embed.images.map((img) => ({
          url: img.local || img.fullsize,
          width: img.aspectRatio.width,
          height: img.aspectRatio.height,
          size: 0, // Size not provided in embed data
        }))
      : undefined,
    video: postData.post.embed?.record
      ? {
          url: postData.post.embed.record?.thumbnail || '',
          width: postData.post.embed.record?.aspectRatio?.width || 0,
          height: postData.post.embed.record?.aspectRatio?.height || 0,
          size: 0, // Size not provided in embed data
        }
      : undefined,
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

function getDisplayDataFromDraft(draftPost: DraftPost): PostDisplayData {
  return {
    text: draftPost.meta.text || '',
    author: {
      displayName: BSKY_DISPLAY_NAME, // TODO: Get this from bluesky profile data
      handle: BSKY_IDENTIFIER,
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

export default function Post({
  variant,
  postData,
  draftPost,
  displayData,
}: PostProps) {
  const { deleteDraft, duplicateDraft, refresh, publishDraft } =
    useDraftContext()
  const { settings } = useSettingsContext()

  if (settings) {
    BSKY_DISPLAY_NAME = settings.bskyDisplayName || BSKY_DISPLAY_NAME
    BSKY_IDENTIFIER = settings.bskyIdentifier || BSKY_IDENTIFIER
  }

  if (!variant) variant = 'full'

  // Handle conversions
  if (!displayData && postData) {
    displayData = getDisplayDataFromPostData(postData)
  } else if (!displayData && draftPost) {
    displayData = getDisplayDataFromDraft(draftPost)
  }

  const item = displayData

  if (!item) {
    return <div>No post data available</div>
  }

  // Format text with links and mentions
  const formatText = (text: string) => {
    return text.split(/(\s+)/).map((part, index) => {
      // Handle newlines
      if (part.includes('\n')) {
        return part.split('\n').map((line, lineIndex) => (
          <React.Fragment key={`${index}-${lineIndex}`}>
            {line}
            {lineIndex < part.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))
      }
      // Handle URLs
      if (part.match(/^https?:\/\/\S+/)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {part}
          </a>
        )
      }
      // Handle mentions
      if (part.match(/^@\w+/)) {
        return (
          <span key={index} className="text-blue-500">
            {part}
          </span>
        )
      }
      // Handle hashtags
      if (part.match(/^#\w+/)) {
        return (
          <span key={index} className="text-blue-500">
            {part}
          </span>
        )
      }
      return part
    })
  }

  const text = formatText(item.text)
  const itemJson = JSON.stringify(item, null, 2)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(itemJson)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleDeleteDraft = async (post: PostDisplayData) => {
    if (
      post.draftId &&
      confirm('Are you sure you want to delete this draft?')
    ) {
      await deleteDraft(post.draftId)
      await refresh()
    }
  }

  const handleDuplicateDraft = async (post: PostDisplayData) => {
    if (post.draftId) {
      const newPost = await duplicateDraft(post.draftId)
      if (newPost)
        window.location.href = `/drafts/${newPost.meta.directoryName}`
    }
  }

  function compactPostView({ displayData }: { displayData: PostDisplayData }) {
    return (
      <div className="flex items-start gap-3 py-2 px-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors">
        {/* Author avatar placeholder */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-lg font-bold">
          {displayData.author?.displayName
            ? displayData.author.displayName[0]
            : displayData.author?.handle?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate max-w-[120px]">
              {displayData.author?.displayName || displayData.author?.handle}
            </span>
            <span className="text-gray-500 text-xs truncate max-w-[100px]">
              @{displayData.author?.handle}
            </span>
            {displayData.isRepost && (
              <span className="text-green-500 text-xs flex items-center gap-1">
                <Repeat2 className="w-3 h-3" /> Repost
              </span>
            )}
            {displayData.group && (
              <span className="text-blue-500 text-xs flex items-center gap-1">
                <Folder className="w-3 h-3" /> {displayData.group}
              </span>
            )}
            <span className="text-gray-400 text-xs ml-auto">
              {displayData.indexedAt
                ? new Date(displayData.indexedAt).toLocaleDateString()
                : ''}
            </span>
          </div>
          <div className="text-sm text-gray-900 dark:text-gray-100 mt-1 line-clamp-2 break-words">
            {displayData.text.length > 120
              ? displayData.text.slice(0, 120) + '…'
              : displayData.text}
            {displayData.images && displayData.images.length > 0 && (
              <div className="mt-2 relative flex flex-row gap-1">
                {displayData.images.slice(0, 4).map((img, idx) => (
                  <div key={idx} className="relative h-20 w-20">
                    <Image
                      src={img.url}
                      alt={`Post media ${idx + 1}`}
                      className="object-cover rounded-md border border-gray-200 dark:border-gray-700"
                      fill
                      sizes="80px"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            )}
            {/* Engagement metrics */}
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" /> {displayData.likeCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />{' '}
                {displayData.replyCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Repeat2 className="w-3 h-3" /> {displayData.repostCount || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return compactPostView({ displayData: item })
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 shadow-md text-black dark:text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {item.author?.displayName || item.author?.handle}
          </span>
          <span className="text-gray-500 text-sm">@{item.author?.handle}</span>
          {item.parent && (
            <span className="text-blue-500 text-sm">
              <Reply className="w-4 h-4" /> Reply
            </span>
          )}
          {item.isRepost && (
            <span className="text-green-500 text-sm">
              <Repeat2 className="w-4 h-4" /> Repost
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {item.draftId ? (
            <Button
              variant="icon"
              color="tertiary"
              onClick={async () => {
                if (confirm('Are you sure you want to publish this draft?')) {
                  await publishDraft(item.draftId!)
                  await refresh()
                }
              }}
              title="Publish post"
            >
              <CloudUpload className="w-4 h-4" />
            </Button>
          ) : null}
          {item.draftId ? (
            <Button
              variant="icon"
              color="secondary"
              onClick={() => handleDuplicateDraft(item)}
              title="Duplicate post"
            >
              <CopyPlus className="w-4 h-4" />
            </Button>
          ) : null}

          {item.draftId ? (
            <LinkButton
              variant="icon"
              color="primary"
              href={getEditLink(item.draftId)}
              title="Edit post"
            >
              <Edit className="w-4 h-4" />
            </LinkButton>
          ) : null}

          {item.draftId ? (
            <Button
              variant="icon"
              color="danger"
              onClick={() => handleDeleteDraft(item)}
              title="Delete post"
            >
              <Trash className="w-4 h-4" />
            </Button>
          ) : null}

          <Button
            variant="icon"
            color="secondary"
            onClick={copyToClipboard}
            title="Copy JSON to clipboard"
          >
            <Copy className="w-4 h-4" />
          </Button>

          <span className="text-gray-500 text-sm">
            {new Date(item.indexedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <ReplyParents parent={item.parent} root={item.root} />
      <div className="mb-2">{text}</div>
      <PostMediaCarousel media={item.images || []} />
      {/* Engagement metrics */}
      <div className="flex flex-row mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex flex-1 gap-4">
          <span className="text-gray-500 text-sm flex items-center gap-1">
            <Heart className="w-4 h-4" color="red" /> {item.likeCount || 0}
          </span>
          <span className="text-gray-500 text-sm flex items-center gap-1">
            <MessageCircle className="w-4 h-4" color="teal" />{' '}
            {item.replyCount || 0}
          </span>
          <span className="text-gray-500 text-sm flex items-center gap-1">
            <Repeat2 className="w-4 h-4" color="green" />{' '}
            {item.repostCount || 0}
          </span>
        </div>
        {item.slug && (
          <div
            className="flex items-center gap-1 text-sm text-gray-500"
            title="Post slug"
          >
            <FolderPen className="w-4 h-4 text-blue-500" /> {item.slug}
          </div>
        )}
        <div className="flex flex-1 justify-end">
          {item.group && (
            <LinkButton
              href={`/groups/${item.group}`}
              variant="icon"
              className="flex items-center gap-1 text-sm text-gray-500 mr-4"
              title={`Posted in group ${item.group}`}
            >
              <Folder className="w-4 h-4 text-blue-500" />
              <span>{item.group}</span>
            </LinkButton>
          )}
        </div>
      </div>
    </div>
  )
}

interface ReplyParentsProps {
  parent?: PostDisplayData
  root?: PostDisplayData
}

function ReplyParents({ parent, root }: ReplyParentsProps) {
  if (!parent || !root) {
    return null
  }

  return (
    <div className="border-l-4 border-blue-500 pl-4 ml-2 mb-2">
      {root && (
        <div className="mb-2">
          <span className="text-gray-500 text-sm">
            Root post by{' '}
            <span className="text-blue-500">@{root.author?.handle}</span>
          </span>
          <div className="text-gray-600 dark:text-gray-400 text-sm mt-1 italic">
            "{root?.text || ''}"
          </div>
        </div>
      )}
      {parent && (
        <div className="mb-2">
          <span className="text-gray-500 text-sm">
            Parent post by{' '}
            <span className="text-blue-500">@{parent.author?.handle}</span>
          </span>
          <div className="text-gray-600 dark:text-gray-400 text-sm mt-1 italic">
            "{parent.text || ''}"
          </div>
        </div>
      )}
    </div>
  )
}

export { ReplyParents }
export type { PostDisplayData }
