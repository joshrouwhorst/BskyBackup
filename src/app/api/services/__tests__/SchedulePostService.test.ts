import type {
  ScheduleFrequency,
  Schedule,
  CreateScheduleRequest,
} from '@/types/scheduler'
import * as appDataHelpers from '@/app/api-helpers/appData'
import * as draftPostService from '../DraftPostService'

import {
  getNextTriggerTimes,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedules,
  publishNextPost,
} from '../SchedulePostService'

jest.mock('@/config/main', () => ({
  DEFAULT_GROUP: 'default',
  APP_DATA_FILE: './test-app-data.json',
  ENCRYPTION_KEY: 'test-encryption-key',
}))

jest.mock('@/app/api-helpers/appData', () => ({
  getAppData: jest.fn(),
  saveAppData: jest.fn(),
}))
jest.mock('@/app/api/services/DraftPostService', () => ({
  getDraftPostsInSchedule: jest.fn(),
  getDraftPosts: jest.fn(),
  publishDraftPost: jest.fn(),
}))
jest.mock('@/app/api-helpers/logger', () => {
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

describe('getNextTriggerTimes', () => {
  it('should calculate next trigger time', () => {
    const freq: ScheduleFrequency = {
      interval: { every: 1, unit: 'days' },
      timesOfDay: ['08:00'],
      timeZone: 'UTC',
      daysOfMonth: [],
      daysOfWeek: [],
    }
    const lastRun = new Date('2025-09-23T10:00:00Z')
    const next = getNextTriggerTimes(lastRun, freq, 1)
    expect(next[0].toISOString()).toBe('2025-09-24T08:00:00.000Z')
  })

  it('should calculate the time later today if time has not been passed', () => {
    const freq: ScheduleFrequency = {
      interval: { every: 1, unit: 'days' },
      timesOfDay: ['08:00'],
      timeZone: 'UTC',
      daysOfMonth: [],
      daysOfWeek: [],
    }
    const now = new Date('2025-09-23T06:00:00Z')
    const next = getNextTriggerTimes(now, freq, 1)[0]
    expect(next.toISOString()).toBe('2025-09-23T08:00:00.000Z')
  })

  it('should calculate the time to tomorrow if time has passed today', () => {
    const freq: ScheduleFrequency = {
      interval: { every: 1, unit: 'days' },
      timesOfDay: ['08:00'],
      timeZone: 'UTC',
      daysOfMonth: [],
      daysOfWeek: [],
    }
    const now = new Date('2025-09-23T08:01:00Z')
    const next = getNextTriggerTimes(now, freq, 1)[0]
    expect(next.toISOString()).toBe('2025-09-24T08:00:00.000Z')
  })

  it('should calculate multiple times', () => {
    const freq: ScheduleFrequency = {
      interval: { every: 1, unit: 'days' },
      timesOfDay: ['08:00'],
      timeZone: 'UTC',
      daysOfMonth: [],
      daysOfWeek: [],
    }
    const now = new Date('2025-09-23T08:01:00Z')
    const nextTimes = getNextTriggerTimes(now, freq, 3)
    expect(nextTimes[0].toISOString()).toBe('2025-09-24T08:00:00.000Z')
    expect(nextTimes[1].toISOString()).toBe('2025-09-25T08:00:00.000Z')
    expect(nextTimes[2].toISOString()).toBe('2025-09-26T08:00:00.000Z')
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
    ;(draftPostService.getDraftPostsInSchedule as jest.Mock).mockResolvedValue([
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

  it('should publish next post according to what getDraftPostsInSchedule returns', async () => {
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
    ;(draftPostService.getDraftPostsInSchedule as jest.Mock).mockResolvedValue([
      { meta: { directoryName: 'post1' }, group: 'group1' },
      { meta: { directoryName: 'post2' }, group: 'group1' },
      { meta: { directoryName: 'post3' }, group: 'group1' },
      { meta: { directoryName: 'post4' }, group: 'group1' },
      { meta: { directoryName: 'post5' }, group: 'group1' },
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
