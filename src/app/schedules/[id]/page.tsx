import ReorderSchedulePosts from '@/components/ReorderSchedulePosts'
import DraftProvider from '@/providers/DraftsProvider'

export default async function ScheduleSortPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!id) {
    return <div>Schedule not found</div>
  }

  return (
    <DraftProvider>
      <div>
        <h1 className="text-2xl font-bold">Schedule {id}</h1>
        <p className="mb-4">
          Reorder the posts in this schedule to change their order of
          publication if the schedule is active.
        </p>
        <ReorderSchedulePosts scheduleId={id} />
      </div>
    </DraftProvider>
  )
}
