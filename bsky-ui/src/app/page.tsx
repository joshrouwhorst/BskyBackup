import BackupPostList from '@/components/BackupPostList'
import Stats from '@/components/Stats'
import BackupToolBar from '@/components/BackupToolBar'
import AppDataProvider from '@/providers/AppDataProvider'
import BskyBackupProvider from '@/providers/BskyBackupProvider'
import DraftProvider from '@/providers/DraftsProvider'

export default async function Home() {
  return (
    <AppDataProvider>
      <DraftProvider>
        <BskyBackupProvider>
          <main>
            <BackupPostList />
          </main>
          <aside>
            <BackupToolBar />
          </aside>
          <aside>
            <Stats />
          </aside>
        </BskyBackupProvider>
      </DraftProvider>
    </AppDataProvider>
  )
}
