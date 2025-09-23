'use client'

import React from 'react'
import { RefreshCw, Download, Trash2 } from 'lucide-react'

import { useBskyBackupContext } from '@/providers/BskyBackupProvider'
import { useAppDataContext } from '@/providers/AppDataProvider'

export default function BackupToolBar() {
  const { refresh: adRefresh } = useAppDataContext()
  const { refresh: bskyRefresh, runBackup, pruneBsky } = useBskyBackupContext()

  const refresh = async () => {
    await bskyRefresh()
    await adRefresh()
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <button
        onClick={refresh}
        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors cursor-pointer"
        aria-label="Refresh posts"
        title="Refresh posts"
      >
        <RefreshCw className="w-5 h-5" />
      </button>

      <button
        onClick={async () => {
          await runBackup()
          await refresh()
        }}
        className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors cursor-pointer"
        aria-label="Backup data"
        title="Backup data"
      >
        <Download className="w-5 h-5" />
      </button>

      <button
        onClick={async () => {
          if (!confirm('Are you sure you want to prune old data?')) {
            return
          }
          await pruneBsky()
          await refresh()
        }}
        className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors cursor-pointer"
        aria-label="Prune data"
        title="Prune data"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}
