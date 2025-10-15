'use client'

import React from 'react'
import PostList from '@/components/PostList'
import { useBskyBackupContext } from '@/providers/BskyBackupProvider'

export default function BackupPostList() {
  return (
    <PostList context={useBskyBackupContext}>
      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
        <h2 className="text-lg font-semibold mb-2">No backed up posts yet</h2>
        <p className="mb-4">
          Use the{' '}
          <span className="font-semibold text-green-600">green button</span> in
          the toolbar to start a backup.
        </p>
      </div>
    </PostList>
  )
}
