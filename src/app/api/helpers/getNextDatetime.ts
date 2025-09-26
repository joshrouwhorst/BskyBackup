import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

type Unit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'

/**
 * Returns the next Date after (or equal to) `start` that matches the rule.
 *
 * @param start - JS Date
 * @param amount - number to add (used as the recurrence step when stepping forward)
 * @param unit - one of 'minutes'|'hours'|'days'|'weeks'|'months'|'years'
 * @param timeOfDay - optional "HH:mm" or "HH:mm:ss" in the target timezone
 * @param tz - IANA timezone string (e.g., 'UTC' or 'America/New_York')
 * @param dayOfWeek - optional 0-6 (Sunday=0) when unit is 'weeks'
 * @param dayOfMonth - optional 1-31 when unit is 'months'
 */
export function getNextDatetime(
  start: Date,
  amount: number,
  unit: Unit,
  timeOfDay?: string | null,
  tz: string = 'UTC',
  dayOfWeek?: number | null,
  dayOfMonth?: number | null
): Date {
  switch (unit) {
    case 'minutes':
    case 'hours':
      timeOfDay = undefined
      dayOfMonth = undefined
      dayOfWeek = undefined
      break
    case 'days':
      dayOfMonth = undefined
      dayOfWeek = undefined
      break
    case 'weeks':
      dayOfMonth = undefined
      break
    case 'months':
      dayOfWeek = undefined
      break
    default:
      throw new Error(`Unsupported frequency unit: ${unit}`)
  }

  if (amount <= 0) throw new Error('amount must be > 0')
  const startDt = dayjs(start).tz(tz)
  if (!startDt.isValid()) throw new Error('invalid start date')

  const parseTime = (d: dayjs.Dayjs, t?: string | null) => {
    if (!t) return d
    const parts = t.split(':').map((p) => parseInt(p, 10))
    const hh = parts[0] ?? 0
    const mm = parts[1] ?? 0
    const ss = parts[2] ?? 0
    return d.hour(hh).minute(mm).second(ss).millisecond(0)
  }

  // Helper to return JS Date in UTC (ISO-compatible) corresponding to tz-aware dayjs
  const toDate = (d: dayjs.Dayjs) => d.utc().toDate()

  // If unit is a simple offset (minutes/hours/days/weeks/months/years) without day constraints,
  // we use the rule: if timeOfDay is provided, we prefer same period if it hasn't passed; otherwise add amount.
  if (
    !dayOfWeek &&
    !dayOfMonth &&
    ['minutes', 'hours', 'days', 'weeks', 'months', 'years'].includes(unit)
  ) {
    // If unit is 'days' and timeOfDay provided, consider same day if time not passed
    if (unit === 'days' && timeOfDay) {
      const candidateSameDay = parseTime(startDt, timeOfDay)
      if (
        candidateSameDay.isSame(startDt) ||
        candidateSameDay.isAfter(startDt)
      ) {
        return toDate(candidateSameDay)
      }
      // else fall through to add 1 * amount days and set time
      const next = parseTime(startDt.add(amount, 'day'), timeOfDay)
      return toDate(next)
    }

    // For other units where timeOfDay provided, apply time after adding the amount unless same-period rule needed.
    const next = startDt.add(amount, unit)
    const withTime = parseTime(next, timeOfDay)
    return toDate(withTime)
  }

  // When dayOfWeek is provided (weekly recurrence)
  if (unit === 'weeks' && dayOfWeek !== undefined && dayOfWeek !== null) {
    // Normalize dayOfWeek 0-6
    const targetDow = ((dayOfWeek % 7) + 7) % 7
    // Start candidate: same day with timeOfDay applied
    let candidate = parseTime(startDt, timeOfDay)
    // If candidate is before start, advance to next day; if it's the same day but wrong weekday, we still search forward
    // Find the next weekday >= candidate (including same day if >= start)
    const startSearch = candidate
    for (let i = 0; i < 7 * 1000; i++) {
      const check = startSearch.add(i, 'day')
      if (check.day() === targetDow) {
        const checkWithTime = parseTime(check, timeOfDay)
        if (checkWithTime.isAfter(startDt) || checkWithTime.isSame(startDt)) {
          return toDate(checkWithTime)
        }
        break
      }
    }
    // If not found in remaining days of this week, add `amount` weeks and search that week
    let weeksAdded = 0
    while (weeksAdded < 1000) {
      weeksAdded += amount
      const baseWeek = startDt.add(weeksAdded, 'week')
      // find the dayOfWeek within that week
      const baseStartOfWeek = baseWeek.startOf('week') // dayjs week start depends on locale; using Sunday start
      for (let d = 0; d < 7; d++) {
        const cand = parseTime(baseStartOfWeek.add(d, 'day'), timeOfDay)
        if (cand.day() === targetDow) return toDate(cand)
      }
    }
    throw new Error('unable to compute next weekly occurrence')
  }

  // When dayOfMonth is provided (monthly recurrence)
  if (unit === 'months' && dayOfMonth !== undefined && dayOfMonth !== null) {
    const targetDom = dayOfMonth
    // Try same month first
    const sameMonth = parseTime(startDt, timeOfDay).date(targetDom)
    // If targetDom doesn't exist in this month, dayjs will roll into next month; guard by checking daysInMonth
    const dimSame = startDt.daysInMonth()
    if (targetDom <= dimSame) {
      const candidate = parseTime(startDt.date(targetDom), timeOfDay)
      if (candidate.isAfter(startDt) || candidate.isSame(startDt)) {
        return toDate(candidate)
      }
    }
    // Otherwise advance by amount months until a valid date found
    for (let i = amount; i < 1000 * amount; i += amount) {
      const m = startDt.add(i, 'month')
      const dim = m.daysInMonth()
      if (targetDom > dim) continue
      const candidate = parseTime(m.date(targetDom), timeOfDay)
      if (candidate.isAfter(startDt) || candidate.isSame(startDt)) {
        return toDate(candidate)
      }
    }
    throw new Error('unable to compute next monthly occurrence')
  }

  // Fallback: step forward in unit-sized increments until we find a datetime after start that fits constraints
  let iter = 0
  let cur = startDt
  while (iter++ < 10000) {
    cur = cur.add(amount, unit)
    let candidate = parseTime(cur, timeOfDay)
    if (
      dayOfWeek !== undefined &&
      dayOfWeek !== null &&
      candidate.day() !== dayOfWeek
    ) {
      continue
    }
    if (
      dayOfMonth !== undefined &&
      dayOfMonth !== null &&
      candidate.date() !== dayOfMonth
    ) {
      continue
    }
    if (candidate.isAfter(startDt) || candidate.isSame(startDt)) {
      return toDate(candidate)
    }
  }

  throw new Error('no occurrence found')
}
