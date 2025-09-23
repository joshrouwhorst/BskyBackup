import DraftPostList from '@/components/DraftPostList'
import AppDataProvider from '@/providers/AppDataProvider'
import DraftsProvider from '@/providers/DraftsProvider'

export default async function Drafts() {
  return (
    <AppDataProvider>
      <DraftsProvider>
        <main>
          <DraftPostList />
        </main>
      </DraftsProvider>
    </AppDataProvider>
  )
}
