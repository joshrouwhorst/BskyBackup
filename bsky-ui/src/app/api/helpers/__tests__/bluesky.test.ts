import { AtpAgent } from '@atproto/api'
import * as blueskyHelpers from '../bluesky'
import * as config from '@/config/api'
import fs from 'fs/promises'
import { DraftPost } from '@/types/drafts'

jest.mock('@atproto/api')
jest.mock('@/config/api', () => ({
  BSKY_IDENTIFIER: 'testuser',
  BSKY_PASSWORD: 'testpass',
  DRAFT_POSTS_PATH: '/mock/path',
}))
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}))

const mockLogin = jest.fn()
const mockLogout = jest.fn()
const mockGetAuthorFeed = jest.fn()
const mockDeletePost = jest.fn()
const mockUploadBlob = jest.fn()
const mockPost = jest.fn()

;(AtpAgent as any).mockImplementation(() => ({
  login: mockLogin,
  logout: mockLogout,
  getAuthorFeed: mockGetAuthorFeed,
  deletePost: mockDeletePost,
  uploadBlob: mockUploadBlob,
  post: mockPost,
}))

describe('bluesky helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogin.mockResolvedValue(undefined)
    mockLogout.mockResolvedValue(undefined)
    mockGetAuthorFeed.mockResolvedValue({
      data: {
        feed: [
          {
            post: {
              indexedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
              uri: 'uri1',
            },
            reply: undefined,
          },
          {
            post: {
              indexedAt: new Date('2022-01-01T00:00:00Z').toISOString(),
              uri: 'uri2',
            },
            reply: { root: {}, parent: {} },
          },
        ],
        cursor: undefined,
      },
    })
    mockDeletePost.mockResolvedValue(undefined)
    mockUploadBlob.mockResolvedValue({ data: { blob: { ref: 'blobref' } } })
    mockPost.mockResolvedValue(undefined)
    ;(fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('mock'))
  })

  describe('getPosts', () => {
    it('fetches posts and respects cutoffDate', async () => {
      const posts = await blueskyHelpers.getPosts({
        cutoffDate: new Date('2022-06-01'),
      })
      expect(posts.length).toBe(1)
      expect(mockLogin).toHaveBeenCalled()
      expect(mockLogout).toHaveBeenCalled()
    })

    it('filters out comments if isComment=true', async () => {
      const posts = await blueskyHelpers.getPosts({ isComment: true })
      expect(posts.length).toBe(1)
      expect(posts[0].reply).toBeDefined()
    })

    it('filters out original posts if isComment=false', async () => {
      const posts = await blueskyHelpers.getPosts({ isComment: false })
      expect(posts.length).toBe(1)
      expect(posts[0].reply).toBeUndefined()
    })
  })

  describe('deletePosts', () => {
    it('deletes posts before cutoffDate', async () => {
      await blueskyHelpers.deletePosts({
        cutoffDate: new Date('2023-01-01T01:00:00Z'),
      })
      expect(mockDeletePost).not.toHaveBeenCalledWith('uri1')
      expect(mockDeletePost).toHaveBeenCalledWith('uri2')
      expect(mockLogin).toHaveBeenCalled()
      expect(mockLogout).toHaveBeenCalled()
    })

    it('throws if cutoffDate is missing', async () => {
      await expect(blueskyHelpers.deletePosts({})).rejects.toThrow(
        'cutoffDate is required'
      )
    })
  })

  describe('addPost', () => {
    it('uploads images and posts', async () => {
      const post: DraftPost = {
        meta: {
          id: 'id1',
          text: 'Hello @user https://test.com #tag',
          images: [{ filename: 'img.jpg', mime: 'image/jpeg' }],
          mediaDir: 'media',
        },
        group: 'group1',
      } as any
      await blueskyHelpers.addPost(post)
      expect(mockUploadBlob).toHaveBeenCalled()
      expect(mockPost).toHaveBeenCalled()
      expect(mockLogin).toHaveBeenCalled()
      expect(mockLogout).toHaveBeenCalled()
    })

    it('uploads video if present', async () => {
      const post: DraftPost = {
        meta: {
          id: 'id2',
          text: 'Video post',
          images: [],
          video: { filename: '/mock/video.mp4', mime: 'video/mp4' },
          mediaDir: 'media',
        },
        group: 'group2',
      } as any
      await blueskyHelpers.addPost(post)
      expect(mockUploadBlob).toHaveBeenCalled()
      expect(mockPost).toHaveBeenCalled()
    })
  })

  describe('getFacetsFromText', () => {
    it('extracts mentions, urls, and tags', () => {
      const text = 'Hello @alice check https://foo.com #wow'
      const facets = blueskyHelpers.getFacetsFromText(text)
      expect(
        facets.some(
          (f) => f.features[0].$type === 'app.bsky.richtext.facet#mention'
        )
      ).toBe(true)
      expect(
        facets.some(
          (f) => f.features[0].$type === 'app.bsky.richtext.facet#link'
        )
      ).toBe(true)
      expect(
        facets.some(
          (f) => f.features[0].$type === 'app.bsky.richtext.facet#tag'
        )
      ).toBe(true)
    })

    it('works with real data', () => {
      const text = `New series! Playground Opening

📸 Canon FTb
🎞️ Kodak Gold / Svema 400
📅 September 2025
📍Grand Rapids, Michigan, USA

#grandrapids #michigan #filmphotography #photography #believeinfilm #35mm #kodak #svema`
      const facets = blueskyHelpers.getFacetsFromText(text)
      expect(
        facets.some(
          (f) => f.features[0].$type === 'app.bsky.richtext.facet#mention'
        )
      ).toBe(false)
      expect(
        facets.some(
          (f) => f.features[0].$type === 'app.bsky.richtext.facet#link'
        )
      ).toBe(false)
      expect(
        facets.filter(
          (f) => f.features[0].$type === 'app.bsky.richtext.facet#tag'
        ).length
      ).toBe(8)
      expect(
        facets.filter(
          (f) => f.features[0].$type === 'app.bsky.richtext.facet#tag'
        )[0].index.byteStart
      ).toBe(131)
      expect(
        facets.filter(
          (f) => f.features[0].$type === 'app.bsky.richtext.facet#tag'
        )[0].index.byteEnd
      ).toBe(143)
    })
  })
})
