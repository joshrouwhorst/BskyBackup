import DraftsProvider from '@/providers/DraftsProvider'
import { CreateDraftForm } from '@/components/CreateDraftForm'

export default function CreateDraft() {
  return (
    <div className="max-w-2xl mx-auto my-8">
      <DraftsProvider>
        <CreateDraftForm redirect="/drafts" />
      </DraftsProvider>
    </div>
  )
}
