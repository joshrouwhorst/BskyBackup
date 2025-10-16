import BackupPostList from '@/components/BackupPostList'
import Stats from '@/components/Stats'
import BackupToolBar from '@/components/BackupToolBar'
import BskyBackupProvider from '@/providers/BskyBackupProvider'
import DraftProvider from '@/providers/DraftsProvider'
import Link from '@/components/ui/link'
import { Callout } from '@/components/ui/callout'

export default async function Home() {
  return (
    <DraftProvider>
      <BskyBackupProvider>
        <div className="flex flex-col-reverse md:flex-row justify-center gap-4">
          <main className="w-full md:w-1/2">
            <BackupToolBar />
            <BackupPostList />
          </main>
          <aside className="w-full md:w-1/2">
            <h1 className="text-2xl font-bold mb-4">Backup</h1>
            <p className="mb-4">
              This tool helps you back up your posts from Bluesky to your local
              filesystem at the Backup Location in{' '}
              <Link href="/settings">Settings</Link>.
            </p>

            <p className="mb-4">
              The prune button will perform a backup then will delete any posts
              on your Bluesky account older than the number of months you
              specify in Settings.
            </p>

            <Callout variant="danger" className="my-4">
              <p>
                This app is still a work in progress. Sometimes the filesystem
                can be slow and require a few refreshes for changes to show up.
              </p>
            </Callout>
            <Stats />
          </aside>
        </div>
      </BskyBackupProvider>
    </DraftProvider>
  )
}
