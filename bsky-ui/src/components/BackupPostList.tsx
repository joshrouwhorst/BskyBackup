'use client'

import React from 'react'
import PostList from '@/components/PostList'
import { useBskyBackupContext } from '@/providers/BskyBackupProvider'

export default function BackupPostList() {
  return <PostList context={useBskyBackupContext} />
}
