import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { safeName, ensureDir } from '@/app/api/helpers/utils'
import type {
  CreateDraftInput,
  DraftPost,
  DraftMeta,
  DraftMedia,
  DraftMediaFileInput,
} from '@/types/drafts'
import sharp from 'sharp'
import {
  DRAFT_MEDIA_ENDPOINT,
  PUBLISHED_POSTS_PATH,
  DEFAULT_GROUP,
  DEFAULT_POST_SLUG,
} from '@/config/api'
import Logger from './logger'
import { Governor } from './governor'

const META_FILENAME = 'meta.json'
const TEXT_FILENAME = 'post.txt'
const MEDIA_DIRNAME = 'media'

const logger = new Logger('PostsStore')
const governor = new Governor(1000) // Just to make sure we don't accidentally do too much at once

function extFromFilename(filename: string) {
  return path.extname(filename) || ''
}

function generateDirPath({
  createdAt,
  root,
  slug,
  group,
}: {
  createdAt: string
  root: string
  slug?: string
  group?: string
}): { directoryName: string; slug: string; fullPath: string } {
  const newSlug = slug ? safeName(slug) : safeName(DEFAULT_POST_SLUG)
  // Format createdAt as YYYYMMDDHHmmss
  const date = new Date(createdAt)
  const pad = (n: number) => n.toString().padStart(2, '0')
  const formattedDate = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('')
  const directoryName = `${formattedDate}_${newSlug}`
  const dirItems = group ? [root, group, directoryName] : [root, directoryName]
  return { directoryName, slug: newSlug, fullPath: path.join(...dirItems) }
}

export class PostsStore {
  root: string
  _listCache: DraftPost[] | null = null
  _cacheTime: number = 0
  _cacheDuration: number = 5000 // ms

  constructor(rootDir: string) {
    this.root = rootDir
  }

  private async writeFile(filePath: string, data: Buffer) {
    await fs.writeFile(filePath, data)
  }

  private async writeMeta(directoryPath: string, meta: DraftMeta) {
    const p = path.join(directoryPath, META_FILENAME)
    await fs.writeFile(p, JSON.stringify(meta, null, 2), 'utf8')
  }

  private async writeText(dir: string, text: string) {
    const p = path.join(dir, TEXT_FILENAME)
    await fs.writeFile(p, text, 'utf8')
  }

  private async readText(dir: string): Promise<string> {
    const p = path.join(dir, TEXT_FILENAME)
    try {
      return await fs.readFile(p, 'utf8')
    } catch (err) {
      return '' // No text file means no text
    }
  }

  // For when the shape of DraftPost or DraftMeta changes
  async migratePostStructures(): Promise<void> {
    const posts = await this.listPosts()
    for (const post of posts) {
      const { directoryName, slug, fullPath } = generateDirPath({
        createdAt: post.meta.createdAt,
        root: this.root,
        slug: post.meta.slug,
        group: post.group,
      })
      await this.updatePostDirectoryName(post.dir, fullPath)
      post.meta.directoryName = directoryName
      post.meta.slug = slug
      post.dir = fullPath
      await this.writeMeta(post.dir, post.meta)
    }
  }

  async createPost(input: CreateDraftInput): Promise<DraftPost> {
    const text = input.text || ''
    const inputImages = input.images ?? []
    if (inputImages.length > 4) throw new Error('max 4 images allowed')

    if (input.video && input.video.kind !== 'video') {
      throw new Error("video kind must be 'video'")
    }

    if (!input.group) {
      input.group = DEFAULT_GROUP
    }

    // choose id and directory names
    const createdAt = input.createdAt ?? new Date().toISOString()

    const {
      directoryName,
      slug,
      fullPath: postDir,
    } = generateDirPath({
      createdAt,
      root: this.root,
      slug: input.slug,
      group: input.group,
    })
    input.slug = slug

    const mediaDir = path.join(postDir, MEDIA_DIRNAME)

    await ensureDir(mediaDir)

    // save text to markdown file
    if (text) {
      await this.writeText(postDir, text)
    }

    // save images (if any)
    for (let i = 0; i < inputImages.length; i++) {
      await this.addImage(inputImages[i], i, mediaDir)
    }

    // save video (if any)
    if (input.video) {
      const vid = input.video
      const ext = extFromFilename(vid.filename) || '.mp4'
      const fname = `video${ext}`
      const outPath = path.join(mediaDir, fname)

      // Convert data to Buffer if it's not already
      const bufferData = Buffer.isBuffer(vid.data)
        ? vid.data
        : Buffer.from(vid.data)

      await this.writeFile(outPath, bufferData)
    }

    const { images, video } = await this.readMedia(postDir)

    const meta: DraftMeta = {
      directoryName,
      slug: input.slug,
      createdAt,
      mediaDir: MEDIA_DIRNAME,
      images: images || [],
      video: video || null,
      extra: input.extra ?? {},
      priority: -1,
    }

    await this.writeMeta(postDir, meta)

    // Return post with text loaded from file
    const postText = await this.readText(postDir)
    logger.log(
      `Created draft post ${directoryName} in ${input.group || 'no group'}.`
    )
    return {
      dir: postDir,
      meta: { ...meta, text: postText },
      group: input.group,
    }
  }

  async updatePost(
    directoryName: string,
    input: CreateDraftInput
  ): Promise<DraftPost | null> {
    logger.log(`Updating draft post ${directoryName}.`)
    const posts = await this.listPosts()
    const post = posts.find((p) => p.meta.directoryName === directoryName)
    if (!post) throw new Error('Cannot find post to update')

    // If the id is changing, we need to rename the directory
    if (post.meta.slug !== input.slug) {
      const {
        directoryName: newDirectoryName,
        slug,
        fullPath,
      } = generateDirPath({
        createdAt: post.meta.createdAt,
        root: this.root,
        slug: input.slug,
        group: input.group,
      })
      await this.updatePostDirectoryName(post.dir, fullPath)
      //await wait(2000)
      input.slug = slug
      post.meta.slug = slug
      post.dir = fullPath
      post.meta.directoryName = newDirectoryName
    }

    // Update text file if text is provided
    if (input.text !== undefined) {
      if (input.text) {
        await this.writeText(post.dir, input.text)
      } else {
        // Remove text file if text is empty
        try {
          await fs.unlink(path.join(post.dir, TEXT_FILENAME))
        } catch (err) {
          // File might not exist, that's okay
        }
      }
    }

    if (post.group !== input.group) {
      logger.log(
        `Moving draft post ${directoryName} from group ${post.group} to ${input.group}.`
      )
      await this.movePostToGroup(post, input.group || DEFAULT_GROUP)
    }

    const mediaPath = path.join(post.dir, MEDIA_DIRNAME)

    if (input.images) {
      // Delete any images in media
      await fs.rm(mediaPath, { recursive: true, force: true })

      // Add new images
      await ensureDir(mediaPath)
      for (let i = 0; i < input.images.length; i++) {
        await this.addImage(input.images[i], i, mediaPath)
      }
    }

    if (input.video) {
      // Delete any videos in media
      await fs.rm(mediaPath, { recursive: true, force: true })
      await this.addVideo(input.video, mediaPath)
    }

    await this.writeMeta(post.dir, post.meta)

    return await this.readPostDir(post.meta.directoryName, post.group)
  }

  async readPostDir(
    postDirName: string,
    group: string
  ): Promise<DraftPost | null> {
    const fullPath = group
      ? path.join(this.root, group, postDirName)
      : path.join(this.root, postDirName)
    try {
      const metaRaw = await fs.readFile(
        path.join(fullPath, META_FILENAME),
        'utf8'
      )
      const meta = JSON.parse(metaRaw) as DraftMeta

      // Load text from text file
      const text = await this.readText(fullPath)

      const { images, video } = await this.readMedia(fullPath)

      return {
        dir: fullPath,
        group: group || '',
        meta: { ...meta, text, images: images || [], video: video || null },
      }
    } catch (err) {
      logger.error(
        `Failed to read post directory ${postDirName}${
          group ? `in group ${group}` : ''
        }: ${err}`
      )
      return null
    }
  }

  async updatePostDirectoryName(
    oldPath: string,
    newPath: string
  ): Promise<void> {
    logger.log(`Updating directory name for post ${oldPath} to ${newPath}.`)
    await fs.rename(oldPath, newPath)
  }

  async readMedia(postDir: string): Promise<{
    images?: DraftMedia[] | undefined
    video?: DraftMedia | undefined
  }> {
    const mediaPath = path.join(postDir, MEDIA_DIRNAME)
    await ensureDir(mediaPath)
    const mediaRaw = await fs.readdir(mediaPath)
    const images: DraftMedia[] = []
    let video: DraftMedia | undefined = undefined

    for (const filename of mediaRaw) {
      const filePath = path.join(mediaPath, filename)
      const stats = await fs.stat(filePath)

      if (!stats.isFile()) continue

      const ext = path.extname(filename).toLowerCase()
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
      const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(ext)

      if (isImage) {
        const { width, height } = await getImageDimensions(filePath)

        // Build URL path relative to root
        const urlParts = [DRAFT_MEDIA_ENDPOINT]
        const relativePath = path.relative(this.root, postDir)
        if (relativePath.includes(path.sep)) {
          // Post is in a group
          const pathParts = relativePath.split(path.sep)
          urlParts.push(...pathParts)
        } else {
          // Post is at root level
          urlParts.push(relativePath)
        }
        urlParts.push(MEDIA_DIRNAME, filename)

        images.push({
          filename,
          mime: `image/${ext.slice(1)}`,
          kind: 'image',
          width,
          height,
          size: stats.size,
          url: path.join(...urlParts).replace(/\\/g, '/'),
        })
      } else if (isVideo) {
        const { width, height } = await getVideoDimensions(filePath)

        // Build URL path relative to root
        const urlParts = [DRAFT_MEDIA_ENDPOINT]
        const relativePath = path.relative(this.root, postDir)
        if (relativePath.includes(path.sep)) {
          // Post is in a group
          const pathParts = relativePath.split(path.sep)
          urlParts.push(...pathParts)
        } else {
          // Post is at root level
          urlParts.push(relativePath)
        }
        urlParts.push(MEDIA_DIRNAME, filename)

        video = {
          filename,
          mime: `video/${ext.slice(1)}`,
          kind: 'video',
          width,
          height,
          size: stats.size,
          url: path.join(...urlParts).replace(/\\/g, '/'),
        }
      }
    }

    return { images: images.length > 0 ? images : undefined, video }
  }

  async listPosts(): Promise<DraftPost[]> {
    // simple caching to avoid repeated reads
    const now = Date.now()
    if (this._listCache && now - this._cacheTime < this._cacheDuration) {
      return this._listCache
    }

    await ensureDir(this.root)
    const entries = await fs.readdir(this.root, { withFileTypes: true })
    const results: DraftPost[] = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // See if there is a meta.json file here
        const metaPath = path.join(this.root, entry.name, META_FILENAME)
        try {
          await fs.access(metaPath)
          // If we can access meta.json, this is a post directory
          const p = await this.readPostDir(entry.name, this.root)
          if (p) results.push(p)
          continue // move to next entry
        } catch (err) {
          // No meta.json here, might be a group directory
          const groupPath = path.join(this.root, entry.name)
          const groupEntries = await fs.readdir(groupPath, {
            withFileTypes: true,
          })
          const postDirs = groupEntries
            .filter((d) => d.isDirectory())
            .map((d) => d.name)

          for (const postDirName of postDirs) {
            const p = await this.readPostDir(postDirName, entry.name)
            if (p) {
              p.group = entry.name
              results.push(p)
            }
          }
        }
      }
    }

    // optionally sort by createdAt descending
    results.sort((a, b) => (a.meta.createdAt < b.meta.createdAt ? 1 : -1))
    this._listCache = results
    this._cacheTime = Date.now()
    return results
  }

  async listGroups(): Promise<string[]> {
    await ensureDir(this.root)
    const entries = await fs.readdir(this.root, { withFileTypes: true })
    const groups: string[] = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Check if there is a meta.json file directly inside this directory
        const metaPath = path.join(this.root, entry.name, META_FILENAME)

        try {
          await fs.access(metaPath)
          // If we can access meta.json, this is a post directory, not a group
          continue // skip to next entry
        } catch (err) {
          // No meta.json here, might be a group directory
        }

        // Check if this directory contains any post directories
        const groupPath = path.join(this.root, entry.name)
        const groupEntries = await fs.readdir(groupPath, {
          withFileTypes: true,
        })
        const hasPost = groupEntries.some((d) => {
          if (!d.isDirectory()) return false
          const metaPath = path.join(groupPath, d.name, META_FILENAME)
          return fs
            .access(metaPath)
            .then(() => true)
            .catch(() => false)
        })

        if (hasPost) {
          groups.push(entry.name)
        }
      }
    }

    // Make sure DEFAULT_GROUP is always included
    if (!groups.includes(DEFAULT_GROUP)) {
      groups.push(DEFAULT_GROUP)
    }

    return groups
  }

  async listPostsInGroup(group: string): Promise<DraftPost[]> {
    const allPosts = await this.listPosts()
    return allPosts.filter((p) => p.group === group)
  }

  async deletePost(post: DraftPost): Promise<void> {
    logger.log(`Deleting draft post ${post.meta.directoryName}.`)
    await fs.rm(post.dir, { recursive: true, force: true })
  }

  async duplicatePost(post: DraftPost): Promise<DraftPost> {
    logger.log(`Duplicating draft post ${post.meta.directoryName}.`)
    const createdAt = new Date().toISOString()

    const {
      directoryName: newDirectoryName,
      slug,
      fullPath,
    } = generateDirPath({
      createdAt,
      root: this.root,
      slug: post.meta.slug,
      group: post.group,
    })

    await ensureDir(fullPath)

    // Copy all files and subdirectories from old dir to new dir, except 'media'
    async function copyRecursive(src: string, dest: string) {
      await ensureDir(dest)
      const entries = await fs.readdir(src, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name === MEDIA_DIRNAME) {
          // Skip the 'media' directory
          continue
        }
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)
        if (entry.isDirectory()) {
          await copyRecursive(srcPath, destPath)
        } else {
          await fs.copyFile(srcPath, destPath)
        }
      }
    }
    await copyRecursive(post.dir, fullPath)

    // Update meta.json with new id and createdAt
    const metaPath = path.join(fullPath, META_FILENAME)
    const metaRaw = await fs.readFile(metaPath, 'utf8')
    const meta: DraftMeta = JSON.parse(metaRaw)
    meta.directoryName = newDirectoryName
    meta.slug = slug
    meta.createdAt = createdAt
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8')

    // Load duplicated post
    const duplicated = await this.readPostDir(newDirectoryName, post.group)
    if (!duplicated) throw new Error('Failed to duplicate post')
    duplicated.group = post.group
    return duplicated
  }

  async movePostToGroup(post: DraftPost, newGroup: string): Promise<DraftPost> {
    logger.log(
      `Moving draft post ${post.meta.directoryName} to group ${newGroup}.`
    )
    const groupDir = path.join(this.root, newGroup)
    await ensureDir(groupDir)

    const baseName = path.basename(post.dir)
    const newDir = path.join(groupDir, baseName)

    await fs.rename(post.dir, newDir)
    post.dir = newDir
    post.group = newGroup
    return post
  }

  async getGroupOrder(group: string): Promise<string[]> {
    try {
      const posts = await this.listPostsInGroup(group)
      posts.sort((a, b) => (a.meta.priority < b.meta.priority ? 1 : -1))
      for (let i = 0; i < posts.length; i++) {
        posts[i].meta.priority = i
        const metaPath = path.join(posts[i].dir, META_FILENAME)
        await fs.writeFile(
          metaPath,
          JSON.stringify(posts[i].meta, null, 2),
          'utf8'
        )
      }
      const order = posts
        .sort((a, b) => (a.meta.priority < b.meta.priority ? 1 : -1))
        .map((p) => p.meta.directoryName)
      return order
    } catch (err) {
      return []
    }
  }

  async setGroupOrder(group: string, order: string[]): Promise<void> {
    const posts = await this.listPostsInGroup(group)
    const postMap = new Map(posts.map((p) => [p.meta.directoryName, p]))
    for (let i = 0; i < order.length; i++) {
      const post = postMap.get(order[i])
      if (post) {
        post.meta.priority = i
        const metaPath = path.join(post.dir, META_FILENAME)
        await fs.writeFile(metaPath, JSON.stringify(post.meta, null, 2), 'utf8')
      }
    }
  }

  async removePostFromGroup(post: DraftPost): Promise<DraftPost> {
    logger.log(
      `Removing draft post ${post.meta.directoryName} from ${post.group}.`
    )
    const baseName = path.basename(post.dir)
    const newDir = path.join(this.root, DEFAULT_GROUP, baseName)

    await fs.rename(post.dir, newDir)
    post.dir = newDir
    post.group = DEFAULT_GROUP
    return post
  }

  async movePost(post: DraftPost, newPath: string): Promise<DraftPost> {
    logger.log(`Moving draft post ${post.meta.directoryName} to ${newPath}.`)
    await ensureDir(path.dirname(newPath))
    await fs.rename(post.dir, newPath)
    post.dir = newPath
    return post
  }

  async moveGroup(groupPath: string, newPath: string): Promise<void> {
    logger.log(`Moving group ${groupPath} to ${newPath}.`)
    const fullOldPath = path.join(this.root, groupPath)
    const fullNewPath = path.join(this.root, newPath)
    await ensureDir(path.dirname(fullNewPath))
    await fs.rename(fullOldPath, fullNewPath)
  }

  async movePostToPublished(post: DraftPost): Promise<DraftPost> {
    logger.log(`Publishing draft post ${post.meta.directoryName}.`)
    await ensureDir(PUBLISHED_POSTS_PATH)
    const newDir = path.join(
      PUBLISHED_POSTS_PATH,
      ...(post.group ? [post.group] : []),
      path.basename(post.dir)
    )

    await ensureDir(newDir)

    await fs.rename(post.dir, newDir)
    post.dir = newDir
    return post
  }

  // helper to load media buffer if you need it (optional)
  async loadMediaBuffer(
    post: DraftPost,
    mediaFilename: string
  ): Promise<Buffer> {
    const p = path.join(post.dir, post.meta.mediaDir, mediaFilename)
    return fs.readFile(p)
  }

  // New helper to get just the text content
  async getPostText(post: DraftPost): Promise<string> {
    return this.readText(post.dir)
  }

  // New helper to update just the text content
  async updatePostText(post: DraftPost, text: string): Promise<void> {
    if (text) {
      await this.writeText(post.dir, text)
    } else {
      // Remove text file if text is empty
      try {
        await fs.unlink(path.join(post.dir, TEXT_FILENAME))
      } catch (err) {
        // File might not exist, that's okay
      }
    }

    // Update the cached text in the post object
    post.meta.text = text
  }

  async addImage(image: DraftMediaFileInput, index: number, mediaDir: string) {
    const img = image
    const ext = extFromFilename(img.filename) || '.jpg'
    const fname = `image_${index + 1}${ext}`
    const outPath = path.join(mediaDir, fname)

    // Convert data to Buffer if it's not already
    const bufferData = Buffer.isBuffer(img.data)
      ? img.data
      : Buffer.from(img.data)

    await this.writeFile(outPath, bufferData)
  }

  async addVideo(video: DraftMediaFileInput, mediaDir: string) {
    const vid = video
    const ext = extFromFilename(vid.filename) || '.mp4'
    const fname = `video${ext}`
    const outPath = path.join(mediaDir, fname)

    // Convert data to Buffer if it's not already
    const bufferData = Buffer.isBuffer(vid.data)
      ? vid.data
      : Buffer.from(vid.data)

    await this.writeFile(outPath, bufferData)
  }
}

async function getImageDimensions(
  filePath: string
): Promise<{ width: number; height: number; size: number }> {
  try {
    const metadata = await sharp(filePath).metadata()
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: metadata.size || 0,
    }
  } catch (error) {
    // Fallback dimensions if sharp fails
    return { width: 0, height: 0, size: 0 }
  }
}

async function getVideoDimensions(
  filePath: string
): Promise<{ width: number; height: number; size: number }> {
  try {
    const stats = await fs.stat(filePath)
    // For videos, we can't easily get dimensions without additional libraries
    // Return file size and placeholder dimensions
    return {
      width: 0,
      height: 0,
      size: stats.size,
    }
  } catch (error) {
    // Fallback if file access fails
    return { width: 0, height: 0, size: 0 }
  }
}
