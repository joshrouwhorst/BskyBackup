import React, { useEffect, useState } from 'react'
import { useGroups } from '@/hooks/useGroups'
import { Select } from './ui/forms'

interface GroupSelectProps {
  value?: string
  onChange: (group: string) => void
}

export function GroupSelect({ value, onChange }: GroupSelectProps) {
  const [groups, setGroups] = useState<string[]>([])
  const { fetchGroups } = useGroups()

  useEffect(() => {
    const getGroups = async () => {
      const data = await fetchGroups()
      setGroups(data)
    }
    getGroups()
  }, [fetchGroups])

  return (
    <Select
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
        onChange(e.target.value)
      }
      value={value}
    >
      <Select.Option value="">No Group</Select.Option>
      {groups.map((group) => (
        <Select.Option key={group} value={group}>
          {group}
        </Select.Option>
      ))}
    </Select>
  )
}
