import { useScheduleContext } from '@/providers/ScheduleProvider'
import type { CreateScheduleRequest, Schedule } from '@/types/scheduler'
import type React from 'react'
import { GroupSelect } from '../GroupSelect'
import { Button, Checkbox, Input, Label } from '../ui/forms'
import FrequencyInput from './FrequencyInput'

export default function ScheduleEditForm({
  schedule,
  editForm,
  setEditForm,
  onSave,
  onCancel,
}: {
  schedule: Schedule | null
  editForm: Partial<Schedule>
  setEditForm: React.Dispatch<React.SetStateAction<Partial<Schedule>>>
  onSave: () => void
  onCancel: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { createSchedule, updateSchedule } = useScheduleContext()

  const handleSave = async () => {
    if (!editForm.name || !editForm.frequency) {
      alert('Name and Frequency are required')
      return
    }

    if (schedule && editForm.id) {
      // Update existing schedule
      const updatedSchedule: Schedule = {
        id: editForm.id,
        name: editForm.name,
        isActive: editForm.isActive || false,
        frequency: editForm.frequency,
        platforms: editForm.platforms || [],
        group: editForm.group || 'default',
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        createdAt: schedule.createdAt,
      }
      await updateSchedule(updatedSchedule)
    } else {
      // Create new schedule
      const newSchedule: CreateScheduleRequest = {
        name: editForm.name || '',
        isActive: editForm.isActive || false,
        frequency: editForm.frequency,
        platforms: editForm.platforms || [],
        group: editForm.group || 'default',
        startTime: editForm.startTime,
        endTime: editForm.endTime,
      }
      await createSchedule(newSchedule)
    }
    await onSave()
  }
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="name">Name</Label>
          <Input
            type="text"
            id="name"
            value={editForm.name || ''}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="group">Group</Label>
          <GroupSelect
            value={editForm.group}
            includeDefault={false}
            onChange={(group) => {
              setEditForm((prev) => ({
                ...prev,
                group,
              }))
            }}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-row gap-4 *:flex-1">
        <div>
          <Label className="mb-2 block">Start Time</Label>
          <Input
            type="datetime-local"
            value={editForm.startTime ? editForm.startTime.slice(0, 16) : ''}
            onChange={(e) => {
              console.log(`New value: ${e.target.value}`)
              setEditForm((prev) => ({
                ...prev,
                startTime: e.target.value || undefined,
              }))
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <Label className="mb-2 block">End Time</Label>
          <Input
            type="datetime-local"
            value={editForm.endTime ? editForm.endTime.slice(0, 16) : ''}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                endTime: e.target.value || undefined,
              }))
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="my-4">
        <FrequencyInput
          value={editForm.frequency}
          onChange={(frequency) => {
            setEditForm((prev) => ({
              ...prev,
              frequency,
            }))
          }}
        />
      </div>
      <div className="flex items-center">
        <Label htmlFor="isActive" className="text-sm text-gray-700">
          <Checkbox
            id="isActive"
            checked={editForm.isActive || false}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                isActive: e.target.checked,
              }))
            }
            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Active
        </Label>
      </div>
      <div className="flex space-x-3 pt-4">
        <Button onClick={handleSave} color="primary" variant="primary">
          Save
        </Button>
        <Button
          onClick={() => {
            onCancel(false)
            setEditForm({})
          }}
          color="secondary"
          variant="primary"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
