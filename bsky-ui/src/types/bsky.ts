export type { FeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs'

export interface PostData {
  post: PostView
  reply?: ReplyData
  reason?: ReasonRepost
}

export interface ReplyData {
  root: PostView
  parent: PostView
}

export interface ReasonRepost {
  $type: string
  by: Author
  uri: string
  cid: string
  indexedAt: string
}

export interface PostView {
  uri: string
  cid: string
  author: Author
  record: PostRecord
  bookmarkCount: number
  replyCount: number
  repostCount: number
  likeCount: number
  quoteCount: number
  indexedAt: string
  viewer: Viewer
  labels: Label[]
  embed?: EmbedView
  $type?: string
}

export interface Author {
  did: string
  handle: string
  displayName?: string
  avatar?: string
  associated?: {
    chat?: {
      allowIncoming: string
    }
    activitySubscription?: {
      allowSubscriptions: string
    }
  }
  labels: Label[]
  createdAt: string
  viewer?: AuthorViewer
  verification?: {
    verifications: Verification[]
    verifiedStatus: string
    trustedVerifierStatus: string
  }
}

export interface AuthorViewer {
  muted: boolean
  blockedBy: boolean
  following?: string
}

export interface Verification {
  issuer: string
  uri: string
  isValid: boolean
  createdAt: string
}

export interface PostRecord {
  $type: string
  createdAt: string
  langs?: string[]
  text: string
  reply?: {
    parent: {
      cid: string
      uri: string
    }
    root: {
      cid: string
      uri: string
    }
  }
  embed?: Embed
  facets?: Facet[]
}

export interface Facet {
  $type: string
  features: FacetFeature[]
  index: {
    byteEnd: number
    byteStart: number
  }
}

export interface FacetFeature {
  $type: string
  did?: string // for mentions
  uri?: string // for links
}

export interface Embed {
  $type: string
  images?: EmbedImage[]
  external?: {
    uri: string
    title: string
    description?: string
  }
  record?: {
    [key: string]: any
  }
}

export interface EmbedImage {
  alt: string
  aspectRatio: {
    height: number
    width: number
  }
  fullsize: string
  thumb: string
  local: string
}

export interface EmbedView {
  $type: string
  images?: EmbedImageView[]
  external?: {
    uri: string
    title: string
    description?: string
  }
  record?: {
    [key: string]: any
  }
}

export interface EmbedImageView {
  thumb: string
  fullsize: string
  local: string
  alt: string
  aspectRatio: {
    height: number
    width: number
  }
}

export interface Viewer {
  bookmarked: boolean
  threadMuted: boolean
  embeddingDisabled: boolean
  like?: string
  repost?: string
}

export interface Label {
  // Define label structure as needed
}
