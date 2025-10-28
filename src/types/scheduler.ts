// Scheduling System Types

import type { DraftPost } from './drafts'

export interface Schedule {
  id?: string
  cronId?: string
  name: string
  frequency: ScheduleFrequency
  startTime?: string
  endTime?: string
  isActive: boolean
  postOrder?: string[] // Array of DraftPost IDs
  createdAt?: string
  lastTriggered?: string | null
  nextTrigger?: string | null
  platforms: SocialPlatform[]
  group: string
}

export interface ScheduleFrequency {
  interval: {
    every: number
    unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'
  }
  timesOfDay?: string[] // ["14:00"] for daily or longer intervals
  daysOfWeek?: string[] // ["Monday", "Wednesday"] for weekly intervals
  daysOfMonth?: number[] // [1, 15] for monthly intervals
  timeZone?: string // "America/New_York", "UTC", etc.
}

export type SocialPlatform = 'bluesky' | 'mastodon' | 'threads' | 'linkedin'

// API Types

export interface CreateScheduleRequest {
  name: string
  frequency: ScheduleFrequency
  platforms: SocialPlatform[]
  isActive?: boolean
  group: string
}

export interface ScheduleLookups {
  nextPosts: DraftPost[]
  nextPostDates: Date[]
}
