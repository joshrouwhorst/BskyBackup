import {
  ScheduleFrequency,
  Schedule,
  CreateScheduleRequest,
} from '@/types/scheduler'
import * as appDataHelpers from '@/app/api/helpers/appData'
import * as draftPostService from '../DraftPostService'

import {
  getNextDatetime,
  timezoneOffset,
  getNextTriggerTime,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedules,
  getSchedulePosts,
  publishNextPost,
} from '../SchedulePostService'

jest.mock('../../helpers/appData', () => ({
  getAppData: jest.fn(),
  saveAppData: jest.fn(),
}))
jest.mock('../DraftPostService', () => ({
  getDraftPostsInGroup: jest.fn(),
  getDraftPosts: jest.fn(),
  publishDraftPost: jest.fn(),
}))
jest.mock('../../helpers/logger', () => ({
  log: jest.fn(),
  error: jest.fn(),
  opening: jest.fn(),
  closing: jest.fn(),
}))

describe('getNextDatetime', () => {
  it('should add minutes correctly', () => {
    const start = new Date('2025-09-23T10:00:00Z')
    const result = getNextDatetime(start, 15, 'minutes')
    expect(result.toISOString()).toBe('2025-09-23T10:15:00.000Z')
  })

  it('should add hours correctly', () => {
    const start = new Date('2025-09-23T10:00:00Z')
    const result = getNextDatetime(start, 2, 'hours')
    expect(result.toISOString()).toBe('2025-09-23T12:00:00.000Z')
  })

  it('should add days and set timeOfDay', () => {
    const start = new Date('2025-09-23T10:00:00Z')
    const result = getNextDatetime(start, 1, 'days', '08:30')
    expect(result.getHours()).toBe(8)
    expect(result.getMinutes()).toBe(30)
  })

  it('should handle weeks', () => {
    const start = new Date('2025-09-23T10:00:00Z')
    const result = getNextDatetime(start, 1, 'weeks')
    expect(result.toISOString()).toBe('2025-09-30T10:00:00.000Z')
  })

  it('should handle weeks with dayOfWeek and timeZone', () => {
    const start = new Date('2025-09-23T10:00:00Z')
    const result = getNextDatetime(
      start,
      1,
      'weeks',
      '08:30',
      'America/New_York',
      5
    )
    expect(result.toISOString()).toBe('2025-09-26T12:30:00.000Z')
  })

  it('should handle months with dayOfMonth', () => {
    const start = new Date('2025-01-15T10:00:00Z')
    const result = getNextDatetime(
      start,
      1,
      'months',
      '09:00',
      undefined,
      undefined,
      10
    )
    expect(result.getDate()).toBe(10)
    expect(result.getHours()).toBe(9)
  })

  it('should select the next day within the week if the specified day and time has not passed', () => {
    const start = new Date('2025-09-22T10:00:00Z')
    const offset = getNextDatetime(
      start,
      1,
      'weeks',
      '08:00',
      'America/New_York',
      5
    ) // Friday at 8am
    expect(offset.toISOString()).toBe('2025-09-26T12:00:00.000Z') // UTC-4
  })

  it('should select the next day within the month if the specified day and time has not passed', () => {
    const start = new Date('2025-09-15T10:00:00Z')
    const offset = getNextDatetime(
      start,
      1,
      'months',
      '08:00',
      'America/New_York',
      undefined,
      25
    ) // Friday at 8am
    expect(offset.toISOString()).toBe('2025-09-25T12:00:00.000Z') // UTC-4
  })

  it('should select the day within the next month if the specified day and time has passed', () => {
    const start = new Date('2025-09-15T10:00:00Z')
    const offset = getNextDatetime(
      start,
      1,
      'months',
      '08:00',
      'America/New_York',
      undefined,
      10
    ) // Friday at 8am
    expect(offset.toISOString()).toBe('2025-10-10T12:00:00.000Z') // UTC-4
  })
})

describe('timezoneOffset', () => {
  it('should return correct offset for New York during DST', () => {
    const offset = timezoneOffset('2025-09-23', '08:00', 'America/New_York')
    expect(offset).toBe('2025-09-23T12:00:00.000Z') // UTC-4
  })
})

describe('getNextTriggerTime', () => {
  it('should calculate next trigger time', () => {
    const freq: ScheduleFrequency = {
      interval: { every: 1, unit: 'days' },
      timeOfDay: '08:00',
      timeZone: 'UTC',
      dayOfMonth: undefined,
      dayOfWeek: undefined,
    }
    const lastRun = new Date('2025-09-23T10:00:00Z')
    const next = getNextTriggerTime(lastRun, freq)
    expect(next.getUTCHours()).toBe(8)
  })
})

describe('Schedule CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(appDataHelpers.getAppData as jest.Mock).mockResolvedValue({
      schedules: [],
    })
    ;(appDataHelpers.saveAppData as jest.Mock).mockResolvedValue(undefined)
  })

  it('should create a schedule', async () => {
    const req: CreateScheduleRequest = {
      name: 'Test',
      group: 'default',
      frequency: {
        interval: { every: 1, unit: 'days' },
        timeOfDay: '08:00',
        timeZone: 'UTC',
      },
      platforms: ['bluesky'],
    }
    const schedule = await createSchedule(req)
    expect(schedule.name).toBe('Test')
    expect(appDataHelpers.saveAppData).toHaveBeenCalled()
  })

  it('should update a schedule', async () => {
    const schedule: Schedule = {
      id: 'schedule-1',
      name: 'Test',
      frequency: {
        interval: { every: 1, unit: 'days' },
        timeOfDay: '08:00',
        timeZone: 'UTC',
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      platforms: ['bluesky'],
      group: 'default',
    }
    ;(appDataHelpers.getAppData as jest.Mock).mockResolvedValue({
      schedules: [schedule],
    })
    const updated = await updateSchedule('schedule-1', { name: 'Updated' })
    expect(updated.name).toBe('Updated')
    expect(appDataHelpers.saveAppData).toHaveBeenCalled()
  })

  it('should delete a schedule', async () => {
    const schedule: Schedule = {
      id: 'schedule-1',
      name: 'Test',
      frequency: {
        interval: { every: 1, unit: 'days' },
        timeOfDay: '08:00',
        timeZone: 'UTC',
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      platforms: ['bluesky'],
      group: 'default',
    }
    ;(appDataHelpers.getAppData as jest.Mock).mockResolvedValue({
      schedules: [schedule],
    })
    await deleteSchedule('schedule-1')
    expect(appDataHelpers.saveAppData).toHaveBeenCalled()
  })

  it('should get schedules', async () => {
    ;(appDataHelpers.getAppData as jest.Mock).mockResolvedValue({
      schedules: [{ id: '1' }],
    })
    const schedules = await getSchedules()
    expect(schedules.length).toBe(1)
  })
})

describe('getSchedulePosts', () => {
  it('should return posts for a schedule group', async () => {
    const schedule: Schedule = {
      id: 'schedule-1',
      name: 'Test',
      frequency: {
        interval: { every: 1, unit: 'days' },
        timeOfDay: '08:00',
        timeZone: 'UTC',
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      platforms: ['bluesky'],
      group: 'group1',
    }
    ;(appDataHelpers.getAppData as jest.Mock).mockResolvedValue({
      schedules: [schedule],
    })
    ;(draftPostService.getDraftPosts as jest.Mock).mockResolvedValue([
      { group: 'group1', meta: { priority: 2 } },
      { group: 'group1', meta: { priority: 1 } },
      { group: 'group2', meta: { priority: 0 } },
    ])
    const posts = await getSchedulePosts('schedule-1')
    expect(posts.length).toBe(2)
    expect(posts[0].meta.priority).toBe(1)
  })
})

describe('publishNextPost', () => {
  it('should publish next post and update schedule', async () => {
    const schedule: Schedule = {
      id: 'schedule-1',
      name: 'Test',
      frequency: {
        interval: { every: 1, unit: 'days' },
        timeOfDay: '08:00',
        timeZone: 'UTC',
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      platforms: ['bluesky'],
      group: 'group1',
    }
    ;(appDataHelpers.getAppData as jest.Mock).mockResolvedValue({
      schedules: [schedule],
    })
    ;(draftPostService.getDraftPostsInGroup as jest.Mock).mockResolvedValue([
      { meta: { id: 'post1', priority: 1 }, group: 'group1' },
    ])
    ;(draftPostService.publishDraftPost as jest.Mock).mockResolvedValue(
      undefined
    )
    await publishNextPost('schedule-1')
    expect(appDataHelpers.saveAppData).toHaveBeenCalled()
    expect(draftPostService.publishDraftPost).toHaveBeenCalledWith('post1', [
      'bluesky',
    ])
  })

  it('should publish next post with the highest priority and update schedule', async () => {
    const schedule: Schedule = {
      id: 'schedule-1',
      name: 'Test',
      frequency: {
        interval: { every: 1, unit: 'days' },
        timeOfDay: '08:00',
        timeZone: 'UTC',
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      platforms: ['bluesky'],
      group: 'group1',
    }
    ;(appDataHelpers.getAppData as jest.Mock).mockResolvedValue({
      schedules: [schedule],
    })
    ;(draftPostService.getDraftPostsInGroup as jest.Mock).mockResolvedValue([
      { meta: { id: 'post3', priority: 3 }, group: 'group1' },
      { meta: { id: 'post2', priority: 2 }, group: 'group1' },
      { meta: { id: 'post1', priority: 1 }, group: 'group1' },
      { meta: { id: 'post4', priority: 4 }, group: 'group1' },
      { meta: { id: 'post5', priority: -1 }, group: 'group1' },
    ])
    ;(draftPostService.publishDraftPost as jest.Mock).mockResolvedValue(
      undefined
    )
    await publishNextPost('schedule-1')
    expect(appDataHelpers.saveAppData).toHaveBeenCalled()
    expect(draftPostService.publishDraftPost).toHaveBeenCalledWith('post1', [
      'bluesky',
    ])
  })
})

// We recommend installing an extension to run jest tests.
