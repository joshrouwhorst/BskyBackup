import {
  formatDate,
  formatFullDateTime,
  getDateTimeObject,
  to12HourTime,
} from '../utils'

describe('utils', () => {
  // Mock console.log to avoid cluttering test output
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getDateTimeObject', () => {
    it('should parse local datetime string correctly', () => {
      // Use local datetime format to avoid timezone conversion issues
      const result = getDateTimeObject('2025-10-29T15:08:00Z')

      expect(result).not.toBeNull()
      expect(result?.year).toBe('2025')
      expect(result?.month).toBe('October')
      expect(result?.date).toBe('2025-10-29')
      expect(result?.day).toBe('Wednesday')
      expect(result?.hours).toBe('3')
      expect(result?.minutes).toBe('08')
      expect(result?.amPm).toBe('pm')
      expect(result?.time).toBe('3:08 pm')
    })

    it('should parse Date object correctly', () => {
      // Create date using local constructor
      const date = new Date(Date.UTC(2025, 0, 15, 9, 30, 0)) // Month is 0-indexed
      const result = getDateTimeObject(date)

      expect(result).not.toBeNull()
      expect(result?.date).toBe('2025-01-15')
      expect(result?.day).toBe('Wednesday')
      expect(result?.month).toBe('January')
      expect(result?.year).toBe('2025')
      expect(result?.hours).toBe('9')
      expect(result?.minutes).toBe('30')
      expect(result?.amPm).toBe('am')
      expect(result?.time).toBe('9:30 am')
    })

    it('should handle noon correctly', () => {
      const date = new Date(Date.UTC(2025, 5, 15, 12, 0, 0)) // June 15, 2025 12:00 PM
      const result = getDateTimeObject(date)

      expect(result).not.toBeNull()
      expect(result?.hours).toBe('12')
      expect(result?.minutes).toBe('00')
      expect(result?.amPm).toBe('pm')
      expect(result?.time).toBe('12:00 pm')
    })

    it('should handle midnight correctly', () => {
      const date = new Date(Date.UTC(2025, 5, 15, 0, 0, 0)) // June 15, 2025 12:00 AM
      const result = getDateTimeObject(date)

      expect(result).not.toBeNull()
      expect(result?.hours).toBe('12')
      expect(result?.minutes).toBe('00')
      expect(result?.amPm).toBe('am')
      expect(result?.time).toBe('12:00 am')
    })

    it('should handle different months correctly', () => {
      const testCases = [
        {
          date: new Date(2025, 1, 14, 10, 0, 0),
          month: 'February',
          day: 'Friday',
        },
        { date: new Date(2025, 6, 4, 10, 0, 0), month: 'July', day: 'Friday' },
        {
          date: new Date(2025, 11, 25, 10, 0, 0),
          month: 'December',
          day: 'Thursday',
        },
      ]

      testCases.forEach(({ date, month, day }) => {
        const result = getDateTimeObject(date)
        expect(result?.month).toBe(month)
        expect(result?.day).toBe(day)
      })
    })

    it('should return null for empty string', () => {
      const result = getDateTimeObject('')
      expect(result).toBeNull()
    })

    it('should return null for invalid date string', () => {
      const result = getDateTimeObject('invalid-date')
      expect(result).toBeNull()
    })

    it('should handle single digit hours and minutes with proper padding', () => {
      const date = new Date(Date.UTC(2025, 2, 5, 7, 5, 0)) // March 5, 2025 7:05 AM
      const result = getDateTimeObject(date)

      expect(result).not.toBeNull()
      expect(result?.hours).toBe('7')
      expect(result?.minutes).toBe('05')
      expect(result?.time).toBe('7:05 am')
    })

    it('should handle outputting in the given timezone', () => {
      const date = new Date(Date.UTC(2025, 2, 5, 7, 5, 0)) // March 5, 2025 7:05 AM
      const timeZone = 'America/Los_Angeles' // UTC-8
      const result = getDateTimeObject(date, timeZone)

      expect(result).not.toBeNull()
      expect(result?.date).toBe('2025-03-04')
      expect(result?.hours).toBe('11')
      expect(result?.minutes).toBe('05')
      expect(result?.amPm).toBe('pm')
      expect(result?.time).toBe('11:05 pm')

      const timeZone2 = 'America/New_York' // UTC-5
      const result2 = getDateTimeObject(date, timeZone2)

      expect(result2).not.toBeNull()
      expect(result2?.date).toBe('2025-03-05')
      expect(result2?.hours).toBe('2')
      expect(result2?.minutes).toBe('05')
      expect(result2?.amPm).toBe('am')
      expect(result2?.time).toBe('2:05 am')

      const timeZone3 = 'Europe/London' // UTC+0
      const result3 = getDateTimeObject(date, timeZone3)

      expect(result3).not.toBeNull()
      expect(result3?.date).toBe('2025-03-05')
      expect(result3?.hours).toBe('7')
      expect(result3?.minutes).toBe('05')
      expect(result3?.amPm).toBe('am')
      expect(result3?.time).toBe('7:05 am')

      const timeZone4 = 'Asia/Tokyo' // UTC+9
      const result4 = getDateTimeObject(date, timeZone4)

      expect(result4).not.toBeNull()
      expect(result4?.date).toBe('2025-03-05')
      expect(result4?.hours).toBe('4')
      expect(result4?.minutes).toBe('05')
      expect(result4?.amPm).toBe('pm')
      expect(result4?.time).toBe('4:05 pm')
    })
  })

  describe('formatDate', () => {
    it('should format local datetime string correctly', () => {
      const result = formatDate('2025-10-29T15:08:00Z')
      expect(result).toBe('2025-10-29 3:08 pm')
    })

    it('should format Date object correctly', () => {
      const date = new Date(Date.UTC(2025, 0, 15, 9, 30, 0))
      const result = formatDate(date)
      expect(result).toBe('2025-01-15 9:30 am')
    })

    it('should return empty string for invalid date', () => {
      const result = formatDate('invalid-date')
      expect(result).toBe('')
    })

    it('should return empty string for empty input', () => {
      const result1 = formatDate('')
      const result2 = formatDate('invalid-date-string')
      expect(result1).toBe('')
      expect(result2).toBe('')
    })

    it('should handle midnight correctly', () => {
      const date = new Date(Date.UTC(2025, 5, 15, 0, 0, 0))
      const result = formatDate(date)
      expect(result).toBe('2025-06-15 12:00 am')
    })

    it('should handle noon correctly', () => {
      const date = new Date(Date.UTC(2025, 5, 15, 12, 0, 0))
      const result = formatDate(date)
      expect(result).toBe('2025-06-15 12:00 pm')
    })
  })

  describe('formatFullDateTime', () => {
    it('should format full datetime with day name', () => {
      const result = formatFullDateTime('2025-10-29T15:08:00Z')
      expect(result).toBe('Wednesday - 2025-10-29 @ 3:08 pm (UTC)')
    })

    it('should format Date object correctly', () => {
      const date = new Date(Date.UTC(2025, 0, 15, 9, 30, 0))
      const result = formatFullDateTime(date)
      expect(result).toBe('Wednesday - 2025-01-15 @ 9:30 am (UTC)')
    })

    it('should return empty string for invalid date', () => {
      const result = formatFullDateTime('invalid-date')
      expect(result).toBe('')
    })

    it('should return empty string for empty input', () => {
      const result1 = formatFullDateTime('')
      const result2 = formatFullDateTime('invalid-date-string')
      expect(result1).toBe('')
      expect(result2).toBe('')
    })

    it('should handle weekend days correctly', () => {
      const saturday = new Date(Date.UTC(2025, 10, 1, 10, 0, 0)) // November 1, 2025 (Saturday)
      const sunday = new Date(Date.UTC(2025, 10, 2, 10, 0, 0)) // November 2, 2025 (Sunday)

      const satResult = formatFullDateTime(saturday)
      const sunResult = formatFullDateTime(sunday)

      expect(satResult).toContain('Saturday')
      expect(sunResult).toContain('Sunday')
    })

    it('should handle different times of day', () => {
      const morning = new Date(Date.UTC(2025, 5, 15, 8, 0, 0))
      const afternoon = new Date(Date.UTC(2025, 5, 15, 14, 0, 0))
      const evening = new Date(Date.UTC(2025, 5, 15, 20, 0, 0))

      const morningResult = formatFullDateTime(morning)
      const afternoonResult = formatFullDateTime(afternoon)
      const eveningResult = formatFullDateTime(evening)

      expect(morningResult).toContain('8:00 am')
      expect(afternoonResult).toContain('2:00 pm')
      expect(eveningResult).toContain('8:00 pm')
    })

    it('should format special times correctly', () => {
      const midnight = new Date(Date.UTC(2025, 5, 15, 0, 0, 0))
      const noon = new Date(Date.UTC(2025, 5, 15, 12, 0, 0))

      const midnightResult = formatFullDateTime(midnight)
      const noonResult = formatFullDateTime(noon)

      expect(midnightResult).toBe('Sunday - 2025-06-15 @ 12:00 am (UTC)')
      expect(noonResult).toBe('Sunday - 2025-06-15 @ 12:00 pm (UTC)')
    })
  })

  describe('to12HourTime', () => {
    it('should display time in 12 hour format for AM times', () => {
      const time = '09:15'
      const result = to12HourTime(time)
      expect(result).toBe('9:15 am')
    })

    it('should display time in 12 hour format for PM times', () => {
      const time = '14:30'
      const result = to12HourTime(time)
      expect(result).toBe('2:30 pm')
    })

    it('should display time with an ISO string', () => {
      //const date = new Date(Date.UTC(2025, 0, 15, 14, 30, 0)) // Jan 15, 2025 14:30 UTC
      const result = to12HourTime('2025-01-15T14:30:00.000Z')
      expect(result).toBe('2:30 pm')
    })

    it('should return empty string for invalid date', () => {
      const result = to12HourTime('invalid-time')
      expect(result).toBe('')
    })
  })
})
