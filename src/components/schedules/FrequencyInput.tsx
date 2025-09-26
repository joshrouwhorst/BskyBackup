import { useState, useEffect, useCallback } from 'react'
import { ScheduleFrequency } from '@/types/scheduler'
import { Input, Label, Select } from '../ui/forms'
import TimezoneSelect from './TimezoneSelect'

const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const DEFAULT_FREQUENCY: ScheduleFrequency = {
  interval: { every: 1, unit: 'days' },
  dayOfWeek: 0,
  dayOfMonth: 1,
  timeOfDay: '09:00',
  timeZone: 'UTC',
}

export default function FrequencyInput({
  value,
  onChange,
}: {
  value: ScheduleFrequency | undefined
  onChange: (value: ScheduleFrequency) => void
}) {
  const [interval, setInterval] = useState({
    every: value?.interval?.every || DEFAULT_FREQUENCY.interval.every,
    unit: value?.interval?.unit || DEFAULT_FREQUENCY.interval.unit,
  })
  const [dayOfWeek, setDayOfWeek] = useState(
    value?.dayOfWeek !== undefined
      ? value.dayOfWeek
      : DEFAULT_FREQUENCY.dayOfWeek
  )
  const [dayOfMonth, setDayOfMonth] = useState(
    value?.dayOfMonth !== undefined
      ? value.dayOfMonth
      : DEFAULT_FREQUENCY.dayOfMonth
  )
  const [timeOfDay, setTimeOfDay] = useState(
    value?.timeOfDay || DEFAULT_FREQUENCY.timeOfDay
  )
  const [timeZone, setTimeZone] = useState<string | undefined>(value?.timeZone)

  const buildFrequency = useCallback(
    (
      newInterval = interval,
      newDayOfWeek = dayOfWeek,
      newDayOfMonth = dayOfMonth,
      newTimeOfDay = timeOfDay,
      newTimeZone = timeZone
    ): ScheduleFrequency => {
      const frequency: ScheduleFrequency = {
        interval: newInterval,
        timeOfDay: newTimeOfDay,
        timeZone: newTimeZone,
      }

      // Only include dayOfWeek for weekly schedules
      if (newInterval.unit === 'weeks') {
        frequency.dayOfWeek = newDayOfWeek
      }

      // Only include dayOfMonth for monthly schedules
      if (newInterval.unit === 'months') {
        frequency.dayOfMonth = newDayOfMonth
      }

      return frequency
    },
    [interval, dayOfWeek, dayOfMonth, timeOfDay, timeZone]
  )

  // Effect to notify parent of default values on mount ONLY
  useEffect(() => {
    if (!value) {
      onChange(DEFAULT_FREQUENCY)
    }
  }, [])

  // Effect to sync internal state when value prop changes from parent
  useEffect(() => {
    if (value) {
      setInterval({
        every: value.interval?.every || DEFAULT_FREQUENCY.interval.every,
        unit: value.interval?.unit || DEFAULT_FREQUENCY.interval.unit,
      })
      setDayOfWeek(
        value.dayOfWeek !== undefined
          ? value.dayOfWeek
          : DEFAULT_FREQUENCY.dayOfWeek
      )
      setDayOfMonth(
        value.dayOfMonth !== undefined
          ? value.dayOfMonth
          : DEFAULT_FREQUENCY.dayOfMonth
      )
      setTimeOfDay(value.timeOfDay || DEFAULT_FREQUENCY.timeOfDay)
      setTimeZone(value.timeZone || DEFAULT_FREQUENCY.timeZone)
    }
  }, [value])

  const handleIntervalChange = (
    field: 'every' | 'unit',
    newValue: string | number
  ) => {
    const newInterval = { ...interval, [field]: newValue }
    setInterval(newInterval)

    const frequency = buildFrequency(
      newInterval,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      timeZone
    )
    onChange(frequency)
  }

  const handleDayChange = (type: 'week' | 'month', value: number) => {
    if (type === 'week') {
      setDayOfWeek(value)
      const frequency = buildFrequency(
        interval,
        value,
        dayOfMonth,
        timeOfDay,
        timeZone
      )
      onChange(frequency)
    } else {
      setDayOfMonth(value)
      const frequency = buildFrequency(
        interval,
        dayOfWeek,
        value,
        timeOfDay,
        timeZone
      )
      onChange(frequency)
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTimeOfDay(newTime)
    const frequency = buildFrequency(
      interval,
      dayOfWeek,
      dayOfMonth,
      newTime,
      timeZone
    )
    onChange(frequency)
  }

  const handleTimezoneChange = (newTimezone: string) => {
    setTimeZone(newTimezone)
    const frequency = buildFrequency(
      interval,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      newTimezone
    )
    onChange(frequency)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">Every</span>
        <Input
          type="number"
          min="1"
          value={interval.every}
          onChange={(e) =>
            handleIntervalChange('every', parseInt(e.target.value) || 1)
          }
        />

        <Select
          value={interval.unit}
          onChange={(e) => handleIntervalChange('unit', e.target.value)}
        >
          <Select.Option value="minutes">Minutes</Select.Option>
          <Select.Option value="hours">Hours</Select.Option>
          <Select.Option value="days">Days</Select.Option>
          <Select.Option value="weeks">Weeks</Select.Option>
          <Select.Option value="months">Months</Select.Option>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        {interval.unit === 'weeks' && (
          <div>
            <Label>Day of Week</Label>
            <Select
              value={dayOfWeek}
              onChange={(e) =>
                handleDayChange('week', parseInt(e.target.value))
              }
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {daysOfWeek.map((day, index) => (
                <Select.Option key={index} value={index}>
                  {day}
                </Select.Option>
              ))}
            </Select>
          </div>
        )}

        {interval.unit === 'months' && (
          <div>
            <Label>Day of Month</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) =>
                handleDayChange('month', parseInt(e.target.value) || 1)
              }
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div>
          <Label>Time of Day</Label>
          <Input
            type="time"
            value={timeOfDay}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <Label>Time Zone</Label>
          <TimezoneSelect
            value={timeZone}
            onChange={(v) => handleTimezoneChange(v)}
          />
        </div>
      </div>
    </div>
  )
}
