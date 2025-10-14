import { AtpAgent, Agent, RichText } from '@atproto/api'
import { FeedViewPost } from '@/types/bsky'
import { DraftPost } from '@/types/drafts'
import fs from 'fs/promises'
import { Governor } from './governor'
import Logger from '../helpers/logger'
import { getSettings } from '../services/SettingsService'
import { getPaths, PREVENT_POSTING } from '@/config/main'
import { wait } from '@/helpers/utils'
import { getOAuthClient } from './bskyClient'
import ExifReader from 'exifreader'

const logger = new Logger('BlueskySvc')

const governor = new Governor(1000)

export interface PostFilters {
  cutoffDate?: Date
  isComment?: boolean // whether to delete comments/replies as well
}

let postCache: FeedViewPost[] | null = null
let cacheDate: Date | null = null
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Create an authenticated AtpAgent using OAuth or username/password
 * @returns Promise<AtpAgent> - Authenticated agent
 */
export async function createAuthenticatedAgent(): Promise<AtpAgent | Agent> {
  // Check for app password options first, then OAuth
  const settings = await getSettings()
  const BSKY_IDENTIFIER =
    settings?.bskyIdentifier || process.env.BSKY_IDENTIFIER
  const BSKY_PASSWORD = settings?.bskyPassword || process.env.BSKY_PASSWORD

  if (BSKY_IDENTIFIER && BSKY_PASSWORD) {
    const agent = new AtpAgent({
      service: 'https://bsky.social',
    })

    let loginAttempts = 0
    const maxLoginAttempts = 5
    // Retry login
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
        await wait(2000)
      }
    }

    return agent
  }

  if (!BSKY_IDENTIFIER) {
    logger.error('Bluesky identifier is not set in settings')
    throw new Error('Bluesky identifier is not set in settings')
  }

  // Use OAuth authentication
  const oauthClient = await getOAuthClient()
  if (!oauthClient) {
    throw new Error('Failed to create OAuth client')
  }

  const oauthSession = await oauthClient.restore(BSKY_IDENTIFIER)
  return new Agent(oauthSession)
}

export async function getPosts(
  config?: PostFilters,
  useCache: boolean = false
): Promise<FeedViewPost[]> {
  const settings = await getSettings()
  const BSKY_IDENTIFIER =
    settings?.bskyIdentifier || process.env.BSKY_IDENTIFIER
  const BSKY_PASSWORD = settings?.bskyPassword || process.env.BSKY_PASSWORD

  if (!BSKY_IDENTIFIER || !BSKY_PASSWORD) {
    logger.error('Cannot find Bluesky credentials in settings')
    throw new Error('Bluesky credentials are not set in settings')
  }

  logger.log('BSKY_IDENTIFIER:', BSKY_IDENTIFIER)

  // Use cached posts if within cache duration
  if (
    useCache &&
    postCache &&
    cacheDate &&
    new Date().getTime() - cacheDate.getTime() < CACHE_DURATION_MS
  ) {
    logger.log('Using cached posts')
    return postCache
  }

  await governor.wait()

  const postList: FeedViewPost[] = []

  const agent = await createAuthenticatedAgent()
  if (!agent) {
    logger.error('Failed to create authenticated agent')
    throw new Error('Unauthenticated')
  }

  try {
    let cursor: string | undefined

    do {
      logger.log('Fetching posts with cursor:', cursor)
      const response = await agent.getAuthorFeed({
        actor: BSKY_IDENTIFIER.toLowerCase(),
        cursor,
        limit: 100,
      })
      logger.log(`Fetched ${response.data.feed.length} posts`)

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
    logger.error('Error fetching posts:', error)
    throw new Error(
      `Failed to fetch posts: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  } finally {
    try {
      if (agent instanceof AtpAgent) {
        await agent.logout()
      }
    } catch (logoutError) {
      logger.error('Error during logout:', logoutError)
    }
  }

  return postList
}

export async function deletePostsWithUris(postUris: string[]): Promise<void> {
  await governor.wait()
  const agent = await createAuthenticatedAgent()

  try {
    for (const postUri of postUris) {
      logger.log(`Deleting post: ${postUri}`)
      if (PREVENT_POSTING) {
        logger.log(
          'PREVENT_POSTING is enabled, skipping actual deletion of post.'
        )
        continue
      }
      await agent.deletePost(postUri)
      logger.log(`Successfully deleted post: ${postUri}`)
    }
  } catch (error) {
    logger.error('Error deleting post:', error)
    throw new Error(
      `Failed to delete post: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  } finally {
    try {
      if (agent instanceof AtpAgent) {
        await agent.logout()
      }
    } catch (logoutError) {
      console.warn('Error during logout:', logoutError)
    }
  }
}

export async function deletePosts(config: PostFilters): Promise<void> {
  await governor.wait()
  const agent = await createAuthenticatedAgent()
  const settings = await getSettings()
  const BSKY_IDENTIFIER = settings.bskyIdentifier
  if (!BSKY_IDENTIFIER) {
    throw new Error('BSKY_IDENTIFIER is not defined')
  }

  try {
    if (!config.cutoffDate) {
      throw new Error('cutoffDate is required to delete posts')
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
        if (PREVENT_POSTING) {
          logger.log(
            'PREVENT_POSTING is enabled, skipping actual deletion of post.'
          )
          continue
        }
        await agent.deletePost(postUri)

        // Add delay between deletions to avoid rate limiting
        await wait(1000)
      } catch (deleteError) {
        logger.error(`Error deleting post ${postUri}:`, deleteError)

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
    logger.error('Error deleting old posts:', error)
    throw new Error(
      `Failed to delete posts: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  } finally {
    try {
      if (agent instanceof AtpAgent) {
        await agent.logout()
      }
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
  const agent = await createAuthenticatedAgent()

  try {
    const { draftPostsPath } = await getPaths()

    if (PREVENT_POSTING) {
      logger.log('PREVENT_POSTING is enabled, skipping actual posting.')
      return
    }

    // The correct way to post
    // Upload images first to get BlobRefs
    const uploadedImages = []
    if (post.meta.images && post.meta.images.length > 0) {
      for (const image of post.meta.images) {
        // Assuming image.filename is a file path or buffer
        const parts = [draftPostsPath]
        if (post.group) {
          parts.push(post.group)
        }
        parts.push(post.meta.directoryName, post.meta.mediaDir, image.filename)
        const path = parts.join('/')
        const imageData = await fs.readFile(path)

        let altText = 'Photograph'
        try {
          // Check for an ImageDescription on the image to set the alt text
          const tags = ExifReader.load(imageData)
          if (
            tags.ImageDescription?.value &&
            typeof tags.ImageDescription?.value === 'string'
          ) {
            altText = tags.ImageDescription.value // string
          } else if (
            tags.ImageDescription?.value &&
            Array.isArray(tags.ImageDescription?.value) &&
            tags.ImageDescription?.value.length > 0 &&
            typeof tags.ImageDescription?.value[0] === 'string'
          ) {
            altText = tags.ImageDescription.value[0] // string[]
          } else if (
            tags.ImageDescription?.value &&
            Array.isArray(tags.ImageDescription?.value) &&
            tags.ImageDescription?.value.length > 0
          ) {
            altText = tags.ImageDescription.value[0].toString() // XmpTag[]
          }
        } catch (err) {
          logger.log('Could not extract image metadata for alt text:', err)
        }

        await governor.wait(200)
        const uploadResponse = await agent.uploadBlob(imageData, {
          encoding: image.mime || 'image/jpeg',
        })
        uploadedImages.push({
          alt: altText,
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

    const richText = new RichText({ text: post.meta.text || '' })

    await richText.detectFacets(agent)

    await governor.wait(200)
    await agent.post({
      text: richText.text,
      createdAt: new Date().toISOString(),
      langs: ['en'],
      facets: richText.facets,
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
      if (agent instanceof AtpAgent) {
        await agent.logout()
      }
    } catch (logoutError) {
      console.warn('Error during logout:', logoutError)
    }
  }
}

/**
 * Download blob data from Bluesky and save it to filesystem
 * @param blobRef - The blob reference (supports both $link and bytes formats)
 * @param filePath - The file path where the blob should be saved
 * @param did - The DID of the user who owns the blob
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function saveBlobToFile(
  blobRef: {
    ref: {
      $link?: string
      bytes?: Uint8Array
    }
    mimeType: string
    size: number
  },
  filePath: string,
  did: string
): Promise<boolean> {
  try {
    const settings = await getSettings()
    const BSKY_IDENTIFIER =
      settings?.bskyIdentifier || process.env.BSKY_IDENTIFIER
    const BSKY_PASSWORD = settings?.bskyPassword || process.env.BSKY_PASSWORD

    if (!BSKY_IDENTIFIER || !BSKY_PASSWORD) {
      logger.error('Cannot find Bluesky credentials for blob download')
      return false
    }

    const agent = new AtpAgent({
      service: 'https://bsky.social',
    })

    await governor.wait()

    await agent.login({
      identifier: BSKY_IDENTIFIER,
      password: BSKY_PASSWORD,
    })

    // Get CID from either $link or bytes format
    let cid: string
    if (blobRef.ref.$link) {
      cid = blobRef.ref.$link
    } else if (blobRef.ref.bytes) {
      cid = bytesToCid(blobRef.ref.bytes)
    } else {
      logger.error('Invalid blob reference format')
      return false
    }

    await governor.wait(1000)
    // Download the blob using the AT Protocol
    const response = await agent.com.atproto.sync.getBlob({
      cid,
      did,
    })

    if (response.success && response.data) {
      // Ensure directory exists
      const path = require('path')
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })

      // Save the blob data to file
      await fs.writeFile(filePath, new Uint8Array(response.data))
      logger.log(`Blob saved successfully to ${filePath}`)
      return true
    } else {
      logger.error('Failed to download blob:', response)
      return false
    }
  } catch (error) {
    logger.error('Error downloading blob:', error)
    return false
  }
}

/**
 * Convert raw CID bytes to string format
 * This handles the multihash format used in AT Protocol
 */
function bytesToCid(bytes: Uint8Array): string {
  // Convert Uint8Array to base58btc string (CID v1 format)
  // This is a simple base58 encoding for the CID
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let result = ''
  let num = BigInt(0)

  // Convert bytes to BigInt
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i])
  }

  // Convert to base58
  while (num > 0) {
    const remainder = Number(num % BigInt(58))
    result = alphabet[remainder] + result
    num = num / BigInt(58)
  }

  // Handle leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = alphabet[0] + result
  }

  return result
}
