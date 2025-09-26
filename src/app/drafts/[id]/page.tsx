import React from "react";
import { CreateDraftForm } from "@/components/CreateDraftForm";

export default async function UpdateDraft({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  return (
    <div className="flex flex-row justify-center">
      <div className="max-w-2xl mx-auto my-8">
        <CreateDraftForm redirect="/drafts" draftId={id} />
      </div>
      <aside className="w-1/4 md:block">
        <h2 className="text-lg font-semibold mb-4">Update Draft</h2>
        <p className="mb-4">
          Use this form to update an existing draft. You can change the content
          and the group of the draft.
        </p>
        <p className="mb-4">
          After updating, you will be redirected to the drafts list where you
          can see all your drafts.
        </p>
      </aside>
    </div>
  );
}
