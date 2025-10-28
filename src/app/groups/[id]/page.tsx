import DraftProvider from '@/providers/DraftsProvider'
import ScheduleProvider from '@/providers/ScheduleProvider'
import ListOrRedirectToSchedule from './components/ListOrRediectToSchedule'

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <DraftProvider>
      <ScheduleProvider>
        <ListOrRedirectToSchedule group={id || null} />
      </ScheduleProvider>
    </DraftProvider>
  )
}
