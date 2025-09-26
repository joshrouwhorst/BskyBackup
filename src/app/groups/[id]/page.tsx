import DraftProvider from "@/providers/DraftsProvider";
import ReorderGroupPosts from "../../../components/ReorderGroupPosts";

export default async function GroupPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  if (!id) {
    return <div>Group not found</div>;
  }

  return (
    <DraftProvider>
      <div>
        <h1 className="text-2xl font-bold">Group {id}</h1>
        <p className="mb-4">
          Reorder the posts in this group to change their order of publication
          if the group is scheduled.
        </p>
        <ReorderGroupPosts group={id} />
      </div>
    </DraftProvider>
  );
}
