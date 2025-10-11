export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  return date.toISOString().replace('T', ' ').split('.')[0]
}

export function formatFullDateTime(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  const d = typeof date === 'string' ? new Date(date) : date
  const dayName = days[d.getDay()]
  const dateStr = d.toISOString().split('T')[0]
  const timeStr = d
    .toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
  return `${dayName} - ${dateStr} @ ${timeStr}`
}

export function displayTime(date: Date | string): string {
  if (typeof date === 'string') {
    // Handle time-only format like '13:00'
    if (date.includes(':') && !date.includes('T') && !date.includes(' ')) {
      const today = new Date()
      const [hours, minutes] = date.split(':').map(Number)
      today.setHours(hours, minutes, 0, 0)
      date = today
    } else {
      date = new Date(date)
    }
  }

  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
