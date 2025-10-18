import { CreateDraftForm } from '@/components/CreateDraftForm'
import TwoColumn from '@/components/ui/TwoColumn'
import DraftProvider from '@/providers/DraftsProvider'

export default function CreateDraft() {
  return (
    <DraftProvider>
      <TwoColumn reverseStack>
        <TwoColumn.Main>
          <CreateDraftForm redirect="/drafts" />
        </TwoColumn.Main>
        <TwoColumn.Side>
          <h2 className="text-lg font-semibold mb-4">Create Draft</h2>
          <p className="mb-4">
            Use this form to create a new draft post. You can add content and
            media and the group of the draft.
          </p>
          <p className="mb-4">
            After creating, you will be redirected to the drafts list where you
            can see all your drafts.
          </p>
        </TwoColumn.Side>
      </TwoColumn>
    </DraftProvider>
  )
}
