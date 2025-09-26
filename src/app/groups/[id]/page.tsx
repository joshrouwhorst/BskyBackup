import ReorderGroupPosts from "../../../components/ReorderGroupPosts"

export default async function GroupPage({ params }: { params: { id: string } }) {
  const { id } = await params

  if (!id) {
    return <div>Group not found</div>
  } 

  return (
    <div>
      <h1>Group {id}</h1>
      <ReorderGroupPosts group={id} />
    </div>
  )
}
