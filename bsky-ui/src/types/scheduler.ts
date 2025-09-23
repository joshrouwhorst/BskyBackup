// Scheduling System Types

export interface Schedule {
  id?: string
  name: string
  frequency: ScheduleFrequency
  isActive: boolean
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
  timeOfDay?: string // "14:00" for daily or longer intervals
  dayOfWeek?: number // 0-6 for weekly intervals (0 = Sunday)
  dayOfMonth?: number // 1-31 for monthly intervals
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
