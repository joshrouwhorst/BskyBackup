import { backupIfNeeded, pruneIfNeeded } from '../CronService'
import * as appDataHelper from '@/app/api-helpers/appData'
import * as BackupService from '../BackupService'

jest.mock('@/config/main', () => ({
  DEFAULT_GROUP: 'default',
  APP_DATA_FILE: './test-app-data.json',
  ENCRYPTION_KEY: 'test-encryption-key',
  getPaths() {
    return {
      mainDataLocation: './data',
      draftPostsPath: './data/draft-posts',
      publishedPostsPath: './data/published-posts',
      backupPath: './data/backup',
      backupMediaPath: './data/backup/media',
      postBackupFile: './data/backup/bluesky-posts.json',
    }
  },
}))
jest.mock('@/app/api-helpers/logger', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
  })),
}))
jest.mock('@/app/api-helpers/appData')
jest.mock('@/app/api/services/BackupService')

describe('CronService.pruneIfNeeded', () => {
  const mockPrunePosts = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
    ;(BackupService.prunePosts as jest.Mock).mockImplementation(mockPrunePosts)
  })

  it('should not prune if autoPruneFrequencyMinutes is not set', async () => {
    ;(appDataHelper.getAppData as jest.Mock).mockResolvedValue({
      settings: { autoPruneFrequencyMinutes: undefined },
      lastPrune: undefined,
    })
    await pruneIfNeeded()
    expect(mockPrunePosts).not.toHaveBeenCalled()
  })

  it('should not prune if autoPruneFrequencyMinutes is <= 0', async () => {
    ;(appDataHelper.getAppData as jest.Mock).mockResolvedValue({
      settings: { autoPruneFrequencyMinutes: 0 },
      lastPrune: undefined,
    })
    await pruneIfNeeded()
    expect(mockPrunePosts).not.toHaveBeenCalled()
  })

  it('should prune if there is no previous prune', async () => {
    ;(appDataHelper.getAppData as jest.Mock).mockResolvedValue({
      settings: { autoPruneFrequencyMinutes: 10 },
      lastPrune: undefined,
    })
    await pruneIfNeeded()
    expect(mockPrunePosts).toHaveBeenCalled()
  })

  it('should prune if nextPrune is due', async () => {
    const now = Date.now()
    ;(appDataHelper.getAppData as jest.Mock).mockResolvedValue({
      settings: { autoPruneFrequencyMinutes: 10 },
      lastPrune: new Date(now - 11 * 60 * 1000).toISOString(),
    })
    await pruneIfNeeded()
    expect(mockPrunePosts).toHaveBeenCalled()
  })

  it('should not prune if nextPrune is not due', async () => {
    const now = Date.now()
    ;(appDataHelper.getAppData as jest.Mock).mockResolvedValue({
      settings: { autoPruneFrequencyMinutes: 10 },
      lastPrune: new Date(now - 5 * 60 * 1000).toISOString(),
    })
    await pruneIfNeeded()
    expect(mockPrunePosts).not.toHaveBeenCalled()
  })
})

describe('CronService.backupIfNeeded', () => {
  const mockRunBackup = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
    ;(BackupService.runBackup as jest.Mock).mockImplementation(mockRunBackup)
  })

  it('should not run backup if autoBackupFrequencyMinutes is not set', async () => {
    ;(appDataHelper.getAppData as jest.Mock).mockResolvedValue({
      settings: { autoBackupFrequencyMinutes: undefined },
      lastBackup: undefined,
    })
    await backupIfNeeded()
    expect(mockRunBackup).not.toHaveBeenCalled()
  })

  it('should not run backup if autoBackupFrequencyMinutes is <= 0', async () => {
    ;(appDataHelper.getAppData as jest.Mock).mockResolvedValue({
      settings: { autoBackupFrequencyMinutes: 0 },
      lastBackup: undefined,
    })
    await backupIfNeeded()
    expect(mockRunBackup).not.toHaveBeenCalled()
  })

  it('should run backup if there is no previous backup', async () => {
    ;(appDataHelper.getAppData as jest.Mock).mockResolvedValue({
      settings: { autoBackupFrequencyMinutes: 10 },
      lastBackup: undefined,
    })
    await backupIfNeeded()
    expect(mockRunBackup).toHaveBeenCalled()
  })

  it('should run backup if nextBackup is due', async () => {
    const now = Date.now()
    ;(appDataHelper.getAppData as jest.Mock).mockResolvedValue({
      settings: { autoBackupFrequencyMinutes: 10 },
      lastBackup: new Date(now - 11 * 60 * 1000).toISOString(),
    })
    await backupIfNeeded()
    expect(mockRunBackup).toHaveBeenCalled()
  })

  it('should not run backup if nextBackup is not due', async () => {
    const now = Date.now()
    ;(appDataHelper.getAppData as jest.Mock).mockResolvedValue({
      settings: { autoBackupFrequencyMinutes: 10 },
      lastBackup: new Date(now - 5 * 60 * 1000).toISOString(),
    })
    await backupIfNeeded()
    expect(mockRunBackup).not.toHaveBeenCalled()
  })
})
