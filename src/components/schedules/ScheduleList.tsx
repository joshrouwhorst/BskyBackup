'use client'

import React from 'react'
import { Schedule } from '@/types/scheduler'
import ScheduleListItem from './ScheduleView'
import { useScheduleContext } from '@/providers/ScheduleProvider'

export default function ScheduleList({
  onEdit,
  onDelete,
  onCreateNew,
  selectedSchedule,
  setSelectedSchedule,
}: {
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
  onCreateNew: () => void
  selectedSchedule: Schedule | null
  setSelectedSchedule: (schedule: Schedule | null) => void
}) {
  const { schedules } = useScheduleContext()
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            All Schedules
          </h2>
          <button
            type="button"
            onClick={onCreateNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 cursor-pointer"
          >
            Create New
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {schedules
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((schedule) => (
            <button
              key={schedule.id}
              type="button"
              className={`w-full text-left p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedSchedule?.id === schedule.id
                  ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500'
                  : ''
              }`}
              onClick={() => setSelectedSchedule(schedule)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedSchedule(schedule)
                }
              }}
              aria-pressed={selectedSchedule?.id === schedule.id}
              tabIndex={0}
            >
              <ScheduleListItem
                key={schedule.id}
                schedule={schedule}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </button>
          ))}
      </div>
    </div>
  )
}
