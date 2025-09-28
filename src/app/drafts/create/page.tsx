import { CreateDraftForm } from "@/components/CreateDraftForm";

export default function CreateDraft() {
  return (
    <div className="flex flex-row justify-center gap-4">
      <div className="max-w-2xl w-3/4">
        <CreateDraftForm redirect="/drafts" />
      </div>
      <aside className="w-1/4 md:block">
        <h2 className="text-lg font-semibold mb-4">Create Draft</h2>
        <p className="mb-4">
          Use this form to create a new draft post. You can add content and
          media and the group of the draft.
        </p>
        <p className="mb-4">
          After creating, you will be redirected to the drafts list where you
          can see all your drafts.
        </p>
      </aside>
    </div>
  );
}
