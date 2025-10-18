import { CreateDraftForm } from '@/components/CreateDraftForm'
import { Callout } from '@/components/ui/callout'
import TwoColumn from '@/components/ui/TwoColumn'
import DraftProvider from '@/providers/DraftsProvider'

export default async function UpdateDraft({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <DraftProvider>
      <TwoColumn reverseStack>
        <TwoColumn.Main>
          <CreateDraftForm redirect="/drafts" directoryName={id} />
        </TwoColumn.Main>
        <TwoColumn.Side>
          <h2 className="text-lg font-semibold mb-4">Update Draft</h2>
          <p className="mb-4">
            Use this form to update an existing draft. You can change the
            content and the group of the draft.
          </p>
          <p className="mb-4">
            After updating, you will be redirected to the drafts list where you
            can see all your drafts.
          </p>
          <Callout variant="info" className="flex-1">
            <p className="m-0">
              Sometimes it takes a few refreshes to get the updated draft data
              to show.
            </p>
          </Callout>
        </TwoColumn.Side>
      </TwoColumn>
    </DraftProvider>
  )
}
