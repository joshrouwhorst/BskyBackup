import { AtpAgent } from '@atproto/api'
import { FeedViewPost } from '@/types/bsky'
import { BSKY_IDENTIFIER, BSKY_PASSWORD, DRAFT_POSTS_PATH } from '@/config/api'
import { DraftPost } from '@/types/drafts'
import fs from 'fs/promises'
import { Main } from '@atproto/api/dist/client/types/app/bsky/richtext/facet'
import { Governor } from './governor'

const governor = new Governor(1000)

export interface PostFilters {
  cutoffDate?: Date
  isComment?: boolean // whether to delete comments/replies as well
}

let postCache: FeedViewPost[] | null = null
let cacheDate: Date | null = null
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export async function getPosts(
  config?: PostFilters,
  useCache: boolean = false
): Promise<FeedViewPost[]> {
  if (!BSKY_IDENTIFIER || !BSKY_PASSWORD) {
    throw new Error('Bluesky credentials are not set in settings')
  }

  console.log('BSKY_IDENTIFIER:', BSKY_IDENTIFIER)

  // Use cached posts if within cache duration
  if (
    useCache &&
    postCache &&
    cacheDate &&
    new Date().getTime() - cacheDate.getTime() < CACHE_DURATION_MS
  ) {
    return postCache
  }

  await governor.wait()

  const postList: FeedViewPost[] = []

  const agent = new AtpAgent({
    service: 'https://bsky.social',
  })

  try {
    await agent.login({
      identifier: BSKY_IDENTIFIER,
      password: BSKY_PASSWORD,
    })

    let cursor: string | undefined

    do {
      const response = await agent.getAuthorFeed({
        actor: BSKY_IDENTIFIER.toLowerCase(),
        cursor,
        limit: 100,
      })

      if (config && config.isComment === true) {
        // Filter out comments/replies, keep only original posts
        response.data.feed = removeOriginalPosts(response.data.feed)
      } else if (config && config.isComment === false) {
        // Filter out original posts, keep only comments/replies
        response.data.feed = removeComments(response.data.feed)
      }

      for (const item of response.data.feed) {
        const post = item.post
        const postDate = new Date(post.indexedAt)

        if (!config?.cutoffDate || postDate < config.cutoffDate) {
          postList.push(item)
        }
      }

      cursor = response.data.cursor
    } while (cursor)

    postCache = postList
    cacheDate = new Date()
  } catch (error) {
    console.error('Error fetching posts:', error)
    throw new Error(
      `Failed to fetch posts: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  } finally {
    try {
      await agent.logout()
    } catch (logoutError) {
      console.warn('Error during logout:', logoutError)
    }
  }

  return postList
}

export async function deletePostsWithUris(postUris: string[]): Promise<void> {
  await governor.wait()
  const agent = new AtpAgent({
    service: 'https://bsky.social',
  })

  try {
    console.log(`Authenticating with Bluesky as ${BSKY_IDENTIFIER}...`)
    await agent.login({
      identifier: BSKY_IDENTIFIER,
      password: BSKY_PASSWORD,
    })
    console.log('Successfully authenticated with Bluesky')

    for (const postUri of postUris) {
      console.log(`Deleting post: ${postUri}`)
      await agent.deletePost(postUri)
      console.log(`Successfully deleted post: ${postUri}`)
    }
  } catch (error) {
    console.error('Error deleting post:', error)
    throw new Error(
      `Failed to delete post: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  } finally {
    try {
      await agent.logout()
    } catch (logoutError) {
      console.warn('Error during logout:', logoutError)
    }
  }
}

export async function deletePosts(config: PostFilters): Promise<void> {
  await governor.wait()
  const agent = new AtpAgent({
    service: 'https://bsky.social',
  })

  try {
    if (!config.cutoffDate) {
      throw new Error('cutoffDate is required to delete posts')
    }

    console.log(`Authenticating with Bluesky as ${BSKY_IDENTIFIER}...`)

    // Login to Bluesky with retry logic
    let loginAttempts = 0
    const maxLoginAttempts = 3

    while (loginAttempts < maxLoginAttempts) {
      try {
        await agent.login({
          identifier: BSKY_IDENTIFIER,
          password: BSKY_PASSWORD,
        })
        console.log('Successfully authenticated with Bluesky')
        break
      } catch (loginError) {
        loginAttempts++
        console.error(`Login attempt ${loginAttempts} failed:`, loginError)

        if (loginAttempts >= maxLoginAttempts) {
          throw new Error(
            `Failed to login after ${maxLoginAttempts} attempts: ${
              loginError instanceof Error ? loginError.message : 'Unknown error'
            }`
          )
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    let cursor: string | undefined
    const postsToDelete: string[] = []
    let pageCount = 0

    console.log('Fetching posts to delete...')

    // Fetch posts from the user's timeline
    do {
      try {
        pageCount++
        console.log(`Fetching page ${pageCount}...`)

        const response = await agent.getAuthorFeed({
          actor: BSKY_IDENTIFIER,
          cursor,
          limit: 100,
        })

        if (config.isComment === true) {
          // Filter out comments/replies, keep only original posts
          response.data.feed = removeOriginalPosts(response.data.feed)
        } else if (config.isComment === false) {
          // Filter out original posts, keep only comments/replies
          response.data.feed = removeComments(response.data.feed)
        }

        for (const item of response.data.feed) {
          const post = item.post
          const postDate = new Date(post.indexedAt)

          if (postDate < config.cutoffDate) {
            postsToDelete.push(post.uri)
          }
        }

        cursor = response.data.cursor

        // Add a small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (fetchError) {
        console.error(`Error fetching page ${pageCount}:`, fetchError)

        // If it's a rate limit or temporary error, wait and retry
        if (
          fetchError instanceof Error &&
          (fetchError.message.includes('rate') ||
            fetchError.message.includes('timeout') ||
            fetchError.message.includes('fetch failed'))
        ) {
          console.log('Retrying after delay...')
          await new Promise((resolve) => setTimeout(resolve, 5000))
          continue
        }

        throw fetchError
      }
    } while (cursor)

    console.log(`Found ${postsToDelete.length} posts to delete`)

    // Delete the old posts
    for (let i = 0; i < postsToDelete.length; i++) {
      const postUri = postsToDelete[i]
      try {
        console.log(
          `Deleting post ${i + 1}/${postsToDelete.length}: ${postUri}`
        )
        await governor.wait(200)
        await agent.deletePost(postUri)

        // Add delay between deletions to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (deleteError) {
        console.error(`Error deleting post ${postUri}:`, deleteError)

        // Continue with other posts even if one fails
        if (
          deleteError instanceof Error &&
          deleteError.message.includes('not found')
        ) {
          console.log('Post already deleted, continuing...')
          continue
        }

        // For other errors, you might want to stop or continue based on your needs
        throw deleteError
      }
    }
  } catch (error) {
    console.error('Error deleting old posts:', error)
    throw new Error(
      `Failed to delete posts: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  } finally {
    try {
      await agent.logout()
    } catch (logoutError) {
      console.warn('Error during logout:', logoutError)
    }
  }
}

function removeComments(posts: FeedViewPost[]): FeedViewPost[] {
  return posts.filter((item) => {
    return !item.reply
  })
}

function removeOriginalPosts(posts: FeedViewPost[]): FeedViewPost[] {
  return posts.filter((item) => {
    return !!item.reply
  })
}

export async function addPost(post: DraftPost) {
  await governor.wait()
  const agent = new AtpAgent({
    service: 'https://bsky.social',
  })

  try {
    await agent.login({
      identifier: BSKY_IDENTIFIER,
      password: BSKY_PASSWORD,
    })

    // The correct way to post
    // Upload images first to get BlobRefs
    const uploadedImages = []
    if (post.meta.images && post.meta.images.length > 0) {
      for (const image of post.meta.images) {
        // Assuming image.filename is a file path or buffer
        const parts = [DRAFT_POSTS_PATH]
        if (post.group) {
          parts.push(post.group)
        }
        parts.push(post.meta.id, post.meta.mediaDir, image.filename)
        const path = parts.join('/')
        const imageData = await fs.readFile(path) // or however you get the image data
        await governor.wait(200)
        const uploadResponse = await agent.uploadBlob(imageData, {
          encoding: image.mime || 'image/jpeg',
        })
        uploadedImages.push({
          alt: 'Photograph',
          image: uploadResponse.data.blob,
        })
      }
    }

    let uploadedVideo = null
    if (post.meta.video) {
      const videoData = await fs.readFile(post.meta.video.filename)
      await governor.wait(200)
      const uploadResponse = await agent.uploadBlob(videoData, {
        encoding: post.meta.video.mime || 'video/mp4',
      })
      uploadedVideo = {
        alt: 'Video',
        video: uploadResponse.data.blob,
        thumb: uploadedImages[0]?.image || undefined, // Use first image as thumbnail if available
      }
    }

    const facets = post.meta.text ? getFacetsFromText(post.meta.text) : []

    await governor.wait(200)
    await agent.post({
      text: post.meta.text,
      createdAt: new Date().toISOString(),
      langs: ['en'],
      facets,
      embed:
        uploadedImages.length > 0
          ? {
              $type: 'app.bsky.embed.images',
              images: uploadedImages,
            }
          : undefined,
      video: uploadedVideo
        ? {
            $type: 'app.bsky.embed.video',
            ...uploadedVideo,
          }
        : undefined,
    })

    console.log(`Successfully added post: ${post.meta.text}`)
  } catch (error) {
    console.error('Error adding post:', error)
    throw error
  } finally {
    // Always logout in finally block
    try {
      await agent.logout()
    } catch (logoutError) {
      console.warn('Error during logout:', logoutError)
    }
  }
}

// Convert UTF-16 code-unit index/length to UTF-8 byte offsets
function utf16IndexToUtf8ByteOffset(str: string, utf16Index: number) {
  // take substring up to utf16Index, encode as UTF-8, return byte length
  return new TextEncoder().encode(str.slice(0, utf16Index)).length
}

function utf16RangeToUtf8ByteRange(
  str: string,
  utf16Start: number,
  utf16Length: number
) {
  const byteStart = utf16IndexToUtf8ByteOffset(str, utf16Start)
  const byteEnd =
    byteStart +
    new TextEncoder().encode(str.slice(utf16Start, utf16Start + utf16Length))
      .length
  return { byteStart, byteEnd }
}

export function getFacetsFromText(text: string): Main[] {
  return text
    .split(/(\s+)/)
    .map((part, index) => {
      // Handle URLs
      if (part.match(/^https?:\/\/\S+/)) {
        const { byteStart, byteEnd } = utf16RangeToUtf8ByteRange(
          text,
          text.indexOf(part),
          part.length
        )
        return {
          $type: 'app.bsky.richtext.facet',
          index: {
            byteStart,
            byteEnd,
          },
          features: [
            {
              $type: 'app.bsky.richtext.facet#link',
              uri: part,
            },
          ],
        } as Main
      }
      // Handle mentions
      if (part.match(/^@\w+/)) {
        const { byteStart, byteEnd } = utf16RangeToUtf8ByteRange(
          text,
          text.indexOf(part),
          part.length
        )
        return {
          $type: 'app.bsky.richtext.facet',
          index: {
            byteStart,
            byteEnd,
          },
          features: [
            {
              $type: 'app.bsky.richtext.facet#mention',
              did: 'did:example:' + part.slice(1), // Placeholder DID, replace with actual lookup if available
            },
          ],
        }
      }
      // Handle hashtags
      if (part.match(/^#\w+/)) {
        const { byteStart, byteEnd } = utf16RangeToUtf8ByteRange(
          text,
          text.indexOf(part),
          part.length
        )
        return {
          $type: 'app.bsky.richtext.facet',
          index: {
            byteStart,
            byteEnd,
          },
          features: [
            {
              $type: 'app.bsky.richtext.facet#tag',
              tag: part.slice(1),
            },
          ],
        }
      }
      return null
    })
    .filter((f): f is Main => f !== null)
}

export function oldGetFacetsFromText(text: string): Main[] {
  const facets: Main[] = []
  const mentionRegex = /@([a-zA-Z0-9_\.]+)/g
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const tagRegex = /#(\w+)/g

  let match: RegExpExecArray | null
  const encoder = new TextEncoder()
  match = mentionRegex.exec(text)
  while (match !== null) {
    const utf16Index = match.index
    const byteStart = encoder.encode(text.slice(0, utf16Index)).length
    const byteEnd = byteStart + encoder.encode(match[0]).length

    facets.push({
      $type: 'app.bsky.richtext.facet',
      index: { byteStart, byteEnd },
      features: [
        {
          $type: 'app.bsky.richtext.facet#mention',
          did: 'did:example:' + match[1], // Placeholder DID, replace with actual lookup if available
        },
      ],
    })
    match = mentionRegex.exec(text)
  }

  match = urlRegex.exec(text)
  while (match !== null) {
    const utf16Index = match.index
    const byteStart = encoder.encode(text.slice(0, utf16Index)).length
    const byteEnd = byteStart + encoder.encode(match[0]).length
    facets.push({
      $type: 'app.bsky.richtext.facet',
      index: { byteStart, byteEnd },
      features: [
        {
          $type: 'app.bsky.richtext.facet#link',
          uri: match[0],
        },
      ],
    })
    match = urlRegex.exec(text)
  }

  match = tagRegex.exec(text)
  while (match !== null) {
    const utf16Index = match.index
    const byteStart = encoder.encode(text.slice(0, utf16Index)).length
    const byteEnd = byteStart + encoder.encode(match[0]).length
    facets.push({
      $type: 'app.bsky.richtext.facet',
      index: { byteStart, byteEnd },
      features: [
        {
          $type: 'app.bsky.richtext.facet#tag',
          tag: match[1],
        },
      ],
    })
    match = tagRegex.exec(text)
  }

  return facets
}
