import fs from 'node:fs/promises'
import path from 'node:path'
import { listFiles, writeFile } from '../FileService'

const testDir = path.join(__dirname, 'test-files')
const nestedDir = path.join(testDir, 'nested')
const testFile1 = path.join(testDir, 'file1.txt')
const testFile2 = path.join(testDir, 'file2.txt')
const nestedFile = path.join(nestedDir, 'nested.txt')

jest.mock('@/config/main', () => ({
  DATA_LOCATION: path.join(__dirname, 'test-files'),
}))

jest.mock('@/app/api-helpers/logger', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
  })),
}))

beforeAll(async () => {
  await fs.mkdir(testDir, { recursive: true })
  await fs.mkdir(nestedDir, { recursive: true })
  await fs.writeFile(testFile1, 'hello')
  await fs.writeFile(testFile2, 'world')
  await fs.writeFile(nestedFile, 'nested')
})

afterAll(async () => {
  await fs.rm(testDir, { recursive: true, force: true })
})

describe('FileService', () => {
  it('should list files in directory and subdirectories', async () => {
    const files = await listFiles(testDir)
    expect(files.length).toEqual(3)
    expect(files[0].name).toEqual('file1.txt')
    expect(files[0].isDirectory).toEqual(false)
    expect(files[1].name).toEqual('file2.txt')
    expect(files[1].isDirectory).toEqual(false)
    expect(files[2].name).toEqual('nested')
    expect(files[2].isDirectory).toEqual(true)
  })
})
