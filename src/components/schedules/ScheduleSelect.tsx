import { Select } from '../ui/forms'
import { Schedule } from '@/types/scheduler'
import { useScheduleContext } from '@/providers/ScheduleProvider'

export default function ScheduleSelect({
  value,
  onChange,
}: {
  value: Schedule | null
  onChange: (schedule: Schedule | null) => void
}) {
  const { schedules } = useScheduleContext()
  return (
    <Select
      value={value?.id ?? ''}
      onChange={
        onChange
          ? (e) => {
              const selected =
                schedules.find((s) => s.id === e.target.value) || null
              onChange(selected)
            }
          : undefined
      }
    >
      {schedules.map((schedule) => (
        <Select.Option key={schedule.id} value={schedule.id}>
          {schedule.name}
        </Select.Option>
      ))}
    </Select>
  )
}
