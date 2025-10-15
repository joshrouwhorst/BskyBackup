import { promises as fs } from 'fs'
import path from 'path'
import Logger from '../../api-helpers/logger'

const logger = new Logger('FileService')

export interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  size?: number
  lastModified?: Date
  content?: string | Buffer
  children?: Map<string, FileNode>
}

export async function readText(filePath: string): Promise<string | null> {
  try {
    const content = await readFile(filePath)
    return content?.toString('utf-8') || null
  } catch (error) {
    logger.error(`Failed to read file ${filePath}`, error)
    throw error
  }
}

export async function readFile(filePath: string): Promise<Buffer | null> {
  const resolvedPath = path.resolve(filePath)

  try {
    const stats = await fs.stat(resolvedPath)
    if (stats.isDirectory()) {
      throw new Error(`Path ${resolvedPath} is a directory, not a file`)
    }
    return await fs.readFile(resolvedPath)
  } catch (error) {
    logger.error(`Failed to read file ${resolvedPath}`, error)
    throw error
  }
}

export async function writeFile(
  filePath: string,
  content: string | Buffer
): Promise<void> {
  const resolvedPath = path.resolve(filePath)
  const parentDir = path.dirname(resolvedPath)

  try {
    await fs.mkdir(parentDir, { recursive: true })
    await fs.writeFile(resolvedPath, content)
  } catch (error) {
    logger.error(`Failed to write file ${resolvedPath}`, error)
    throw error
  }
}

export async function deleteFileOrDirectory(targetPath: string): Promise<void> {
  const resolvedPath = path.resolve(targetPath)

  try {
    logger.log(`Deleting ${resolvedPath}`)
    const stats = await fs.stat(resolvedPath)
    if (stats.isDirectory()) {
      await fs.rm(resolvedPath, { recursive: true, force: true })
    } else {
      await fs.unlink(resolvedPath)
    }
  } catch (error) {
    logger.error(`Failed to delete ${resolvedPath}`, error)
    throw error
  }
}

export async function createDirectory(dirPath: string): Promise<void> {
  const resolvedPath = path.resolve(dirPath)

  try {
    logger.log(`Creating directory ${resolvedPath}`)
    await fs.mkdir(resolvedPath, { recursive: true })
  } catch (error) {
    logger.error(`Failed to create directory ${resolvedPath}`, error)
    throw error
  }
}

export async function moveFileOrDirectory(
  oldPath: string,
  newPath: string
): Promise<void> {
  const resolvedOldPath = path.resolve(oldPath)
  const resolvedNewPath = path.resolve(newPath)

  try {
    logger.log(`Moved ${resolvedOldPath} to ${resolvedNewPath}`)
    await fs.rename(resolvedOldPath, resolvedNewPath)
  } catch (error) {
    logger.error(
      `Failed to move ${resolvedOldPath} to ${resolvedNewPath}`,
      error
    )
    throw error
  }
}

export async function moveFilesOrDirectories(
  paths: { oldPath: string; newPath: string }[]
): Promise<void> {
  for (const { oldPath, newPath } of paths) {
    await moveFileOrDirectory(oldPath, newPath)
  }
}

export async function copyFileOrDirectory(
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  const resolvedSourcePath = path.resolve(sourcePath)
  const resolvedDestPath = path.resolve(destinationPath)

  try {
    logger.log(`Copying ${resolvedSourcePath} to ${resolvedDestPath}`)
    await fs.cp(resolvedSourcePath, resolvedDestPath, { recursive: true })
  } catch (error) {
    logger.error(
      `Failed to copy ${resolvedSourcePath} to ${resolvedDestPath}`,
      error
    )
    throw error
  }
}

export async function copyFilesOrDirectories(
  paths: { sourcePath: string; destinationPath: string }[]
): Promise<void> {
  for (const { sourcePath, destinationPath } of paths) {
    await copyFileOrDirectory(sourcePath, destinationPath)
  }
}

export async function checkIfExists(targetPath: string): Promise<boolean> {
  const resolvedPath = path.resolve(targetPath)

  try {
    await fs.access(resolvedPath)
    return true
  } catch {
    return false
  }
}

export async function listFiles(
  dirPath: string,
  recursive: boolean = false
): Promise<FileNode[]> {
  const resolvedPath = path.resolve(dirPath)

  try {
    const readdir = async (resolvedPath: string): Promise<FileNode[]> => {
      const files: FileNode[] = []
      const entries = await fs.readdir(resolvedPath)

      for (const e of entries) {
        const estats = await fs.stat(path.join(resolvedPath, e))
        files.push({
          isDirectory: estats.isDirectory(),
          name: e,
          path: path.join(resolvedPath, e),
          lastModified: estats.mtime,
          size: estats.size,
        } as FileNode)

        if (estats.isDirectory() && recursive) {
          const children = await readdir(path.join(resolvedPath, e))
          files.push(...children)
        }
      }
      return files
    }

    return await readdir(resolvedPath)
  } catch (error) {
    logger.error(`Failed to list files in ${resolvedPath}: ${error}`)
    throw error
  }
}
