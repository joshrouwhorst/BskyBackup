import React from 'react'
import { CreateDraftForm } from '@/components/CreateDraftForm'

export default async function UpdateDraft({
  params,
}: {
  params: { id: string }
}) {
  const { id } = await params
  return (
      <div className="max-w-2xl mx-auto my-8">
        <CreateDraftForm redirect="/drafts" draftId={id} />
      </div>
  )
}
