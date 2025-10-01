import { getPostsStore } from '../helpers/PostsStore'
import { SUPPORTED_SOCIAL_PLATFORMS } from '@/config/main'
import type { CreateDraftInput, DraftPost } from '@/types/drafts'
import { addPost as addPostToBsky } from '@/app/api/helpers/bluesky'
import { SocialPlatform } from '@/types/scheduler'
import Logger from '../helpers/logger'
import { getPaths } from './SettingsService'

const logger = new Logger('DrPostServ')

init()

function init() {
  logger.log('DraftPostService initialized.')
}

export async function getDraftPostsInGroup(
  group: string
): Promise<DraftPost[]> {
  const store = await getPostsStore()
  return store.listPostsInGroup(group)
}

export async function getDraftPosts(): Promise<DraftPost[]> {
  const store = await getPostsStore()
  return store.listPosts()
}

export async function getDraftPost(
  id: string,
  group?: string
): Promise<DraftPost | null> {
  const store = await getPostsStore()
  if (!group) {
    const groups = await store.listGroups()
    for (const g of groups) {
      const post = await store.readPostDir(id, g)
      if (post) return post
    }
    return null
  }
  const post = await store.readPostDir(id, group)
  if (post) return post
  const posts = await store.listPosts()
  return posts.find((p) => p.meta.directoryName === id) || null
}

export async function migratePostStructures(): Promise<void> {
  const store = await getPostsStore()
  await store.migratePostStructures()
}

export async function createDraftPost(
  input: CreateDraftInput
): Promise<DraftPost> {
  const store = await getPostsStore()
  return store.createPost(input)
}

export async function deleteDraftPost(id: string): Promise<void> {
  const store = await getPostsStore()
  const posts = await store.listPosts()
  const post = posts.find((p) => p.meta.directoryName === id)
  if (!post) throw new Error('Post not found')
  return store.deletePost(post)
}

export async function duplicateDraftPost(id: string): Promise<DraftPost> {
  const store = await getPostsStore()
  const posts = await store.listPosts()
  const post = posts.find((p) => p.meta.directoryName === id)
  if (!post) throw new Error('Post not found')
  return store.duplicatePost(post)
}

export async function updateDraftPost(
  id: string,
  input: CreateDraftInput
): Promise<DraftPost | null> {
  const store = await getPostsStore()
  return store.updatePost(id, input)
}

export async function getGroups(): Promise<string[]> {
  const store = await getPostsStore()
  return store.listGroups()
}

export async function readMediaFile(
  post: DraftPost,
  filePath: string
): Promise<Buffer> {
  const store = await getPostsStore()
  return store.loadMediaBuffer(post, filePath)
}

export async function publishDraftPost(
  id: string,
  platforms?: string[]
): Promise<void> {
  const store = await getPostsStore()
  const posts = await store.listPosts()
  const post = posts.find((p) => p.meta.directoryName === id)
  if (!post) throw new Error('Post not found')
  if (!platforms || platforms.length === 0) {
    platforms = [...SUPPORTED_SOCIAL_PLATFORMS]
  }

  for (const platform of platforms) {
    await sendToSocialPlatform(post, platform as SocialPlatform)
  }
}

async function sendToSocialPlatform(
  post: DraftPost,
  platform: SocialPlatform
): Promise<void> {
  const store = await getPostsStore()
  // Implement actual social media posting logic here
  // This would integrate with platform-specific APIs
  switch (platform) {
    case 'bluesky':
      // Integrate with Bluesky API
      await addPostToBsky(post)
      await store.movePostToPublished(post)
      break
    default:
      throw new Error(`Platform ${platform} not supported`)
  }
}

export async function getGroupOrder(group: string): Promise<string[]> {
  ;('')
  const store = await getPostsStore()
  return store.getGroupOrder(group)
}

export async function reorderGroupPosts(
  group: string,
  newOrder: string[]
): Promise<void> {
  logger.log(`Reordering posts for group ${group}.`, { newOrder })
  const postsToReorder = await getDraftPostsInGroup(group)

  if (postsToReorder.length !== newOrder.length) {
    throw new Error('New order length does not match number of scheduled posts')
  }

  const idSet = new Set(postsToReorder.map((p) => p.meta.directoryName))
  for (const id of newOrder) {
    if (!idSet.has(id)) {
      throw new Error(`Post ID ${id} is not part of the scheduled posts`)
    }
  }

  const store = await getPostsStore()
  await store.setGroupOrder(group, newOrder)
}
