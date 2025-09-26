import { getNextDatetime } from '@/app/api/helpers/getNextDatetime'

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

  it('should set timeOfDay with UTC', () => {
    const start = new Date('2025-09-23T10:00:00Z')
    const result = getNextDatetime(start, 1, 'weeks', '08:30', 'UTC')
    expect(result.toISOString()).toBe('2025-09-30T08:30:00.000Z')
  })

  it('should set timeOfDay with America/New_York', () => {
    const start = new Date('2025-09-23T08:30:00Z')
    const result = getNextDatetime(
      start,
      1,
      'weeks',
      '08:30',
      'America/New_York'
    )
    expect(result.toISOString()).toBe('2025-09-30T12:30:00.000Z')
  })

  it('should go to the next time within the day if it has not yet passed', () => {
    const start = new Date('2025-09-23T07:00:00Z')
    const result = getNextDatetime(start, 1, 'days', '08:30', 'UTC')
    expect(result.toISOString()).toBe('2025-09-23T08:30:00.000Z')
  })

  it('should go to the next day if the time has passed', () => {
    const start = new Date('2025-09-23T10:00:00Z')
    const result = getNextDatetime(start, 1, 'days', '08:30', 'UTC')
    expect(result.toISOString()).toBe('2025-09-24T08:30:00.000Z')
  })

  it('should go to the next day and time within the week if it has not yet passed', () => {
    const start = new Date('2025-09-23T07:00:00Z')
    const result = getNextDatetime(start, 1, 'weeks', '08:30', 'UTC', 5)
    expect(result.toISOString()).toBe('2025-09-26T08:30:00.000Z')
  })

  it('should go to the next week if the day and time has passed', () => {
    const start = new Date('2025-09-23T07:00:00Z')
    const result = getNextDatetime(start, 1, 'weeks', '08:30', 'UTC', 1)
    expect(result.toISOString()).toBe('2025-09-29T08:30:00.000Z')
  })

  it('should go to the next day and time within the month if it has not yet passed', () => {
    const start = new Date('2025-09-23T07:00:00Z')
    const result = getNextDatetime(
      start,
      1,
      'months',
      '08:30',
      'UTC',
      undefined,
      23
    )
    expect(result.toISOString()).toBe('2025-09-23T08:30:00.000Z')
  })

  it('should go to the next month if the day and time has passed', () => {
    const start = new Date('2025-09-23T10:00:00Z')
    const result = getNextDatetime(
      start,
      1,
      'months',
      '08:30',
      'UTC',
      undefined,
      23
    )
    expect(result.toISOString()).toBe('2025-10-23T08:30:00.000Z')
  })

  it('should handle a date later this month', () => {
    const start = new Date('2025-09-23T07:00:00Z')
    const result = getNextDatetime(
      start,
      1,
      'months',
      '08:30',
      'UTC',
      undefined,
      28
    )
    expect(result.toISOString()).toBe('2025-09-28T08:30:00.000Z')
  })

  it('should handle a date into next month', () => {
    const start = new Date('2025-09-23T07:00:00Z')
    const result = getNextDatetime(
      start,
      1,
      'months',
      '08:30',
      'UTC',
      undefined,
      5
    )
    expect(result.toISOString()).toBe('2025-10-05T08:30:00.000Z')
  })
})
