/** biome-ignore-all lint/suspicious/noExplicitAny: see code */
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

// https://atproto.com/specs/label
export interface Label {
  /**
   * label schema version (integer). Current version is always 1.
   */
  ver: number

  /**
   * authority (account) which generated this label (DID format)
   */
  src: string

  /**
   * the content this label applies to (URI format). For a record: at:// URI. For an account: the did.
   */
  uri: string

  /**
   * optional CID for a specific version of the subject uri
   */
  cid?: string

  /**
   * the value of the label (string, <= 128 bytes)
   */
  val: string

  /**
   * if true, this label negates an earlier label with the same src, uri, and val
   */
  neg?: boolean

  /**
   * creation timestamp (datetime format)
   */
  cts: string

  /**
   * optional expiration timestamp (datetime format)
   */
  exp?: string

  /**
   * optional cryptographic signature bytes.
   * Represented using the Data Model "bytes" encoding in JSON as an object like { $bytes: "<base64>" }.
   */
  sig?: { $bytes: string } | string
}
