export type MediaKind = 'image' | 'video'

export type DraftMediaFileInput = {
  filename: string // original filename (used for extension)
  data: Buffer // file contents
  kind: MediaKind
  mime?: string // optional mime type
}

export type CreateDraftInput = {
  slug?: string // optional custom slug; otherwise generated
  group: string // group identifier for the post
  text?: string
  images?: DraftMediaFileInput[] // up to 4
  video?: DraftMediaFileInput | null // optional short video
  createdAt?: string // ISO string; defaults to now
  extra?: Record<string, any> // any other small metadata
}

export type DraftMedia = {
  filename: string // original filename (used for extension)
  mime?: string // optional mime type
  kind: MediaKind
  width: number
  height: number
  size: number // file size in bytes
  url?: string
}

export type DraftMeta = {
  directoryName: string // Unique and includes slug
  slug: string // Not necessarily unique
  text?: string
  createdAt: string
  mediaDir: string // relative path under post directory
  images: DraftMedia[]
  video?: DraftMedia | null
  extra?: Record<string, any>
  priority: number // for ordering posts in a group
}

export type DraftPost = {
  dir: string // full path on disk for the post
  group: string // group identifier for the post
  meta: DraftMeta
}
