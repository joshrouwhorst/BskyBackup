import {
  ScheduleFrequency,
  Schedule,
  CreateScheduleRequest,
} from '@/types/scheduler'
import * as appDataHelpers from '@/app/api/helpers/appData'
import * as draftPostService from '../DraftPostService'

import {
  getNextTriggerTime,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedules,
  getSchedulePosts,
  publishNextPost,
} from '../SchedulePostService'

jest.mock('@/config/main', () => ({
  DEFAULT_GROUP: 'default',
}))

jest.mock('../../helpers/appData', () => ({
  getAppData: jest.fn(),
  saveAppData: jest.fn(),
}))
jest.mock('../DraftPostService', () => ({
  getDraftPostsInGroup: jest.fn(),
  getDraftPosts: jest.fn(),
  publishDraftPost: jest.fn(),
}))
jest.mock('../../helpers/logger', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      opening: jest.fn(),
      closing: jest.fn(),
    })),
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      opening: jest.fn(),
      closing: jest.fn(),
    })),
  }
})

describe('getNextTriggerTime', () => {
  it('should calculate next trigger time', () => {
    const freq: ScheduleFrequency = {
      interval: { every: 1, unit: 'days' },
      timesOfDay: ['08:00'],
      timeZone: 'UTC',
      daysOfMonth: [],
      daysOfWeek: [],
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
        timesOfDay: ['08:00'],
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
        timesOfDay: ['08:00'],
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
        timesOfDay: ['08:00'],
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
        timesOfDay: ['08:00'],
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
        timesOfDay: ['08:00'],
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
      { meta: { directoryName: 'post1', priority: 1 }, group: 'group1' },
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
        timesOfDay: ['08:00'],
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
      { meta: { directoryName: 'post2', priority: 2 }, group: 'group1' },
      { meta: { directoryName: 'post3', priority: 3 }, group: 'group1' },
      { meta: { directoryName: 'post1', priority: 1 }, group: 'group1' },
      { meta: { directoryName: 'post4', priority: 4 }, group: 'group1' },
      { meta: { directoryName: 'post5', priority: -1 }, group: 'group1' },
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
