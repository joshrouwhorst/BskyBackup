import { promises as fs } from 'fs'
import path from 'path'
import { EventEmitter } from 'events'
import Logger from '../../api-helpers/logger'
import { DATA_LOCATION } from '@/config/main'

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

export interface WatchOptions {
  recursive?: boolean
  includeBinary?: boolean
  maxFileSize?: number // in bytes
}

export class FileService extends EventEmitter {
  private cache: Map<string, FileNode> = new Map()
  private options: WatchOptions

  constructor(options: WatchOptions = {}) {
    super()
    this.options = {
      recursive: true,
      includeBinary: false,
      maxFileSize: 1024 * 1024, // 1MB default
      ...options,
    }
  }

  /**
   * Load a directory into the cache
   */
  async loadDirectory(dirPath: string): Promise<FileNode> {
    const resolvedPath = path.resolve(dirPath)

    try {
      const stats = await fs.stat(resolvedPath)

      if (!stats.isDirectory()) {
        throw new Error(`Path ${resolvedPath} is not a directory`)
      }

      const node = await this.buildDirectoryTree(resolvedPath)
      this.cache.set(resolvedPath, node)

      logger.log(`Loaded directory tree for ${resolvedPath}`)
      this.emit('directoryLoaded', resolvedPath, node)

      return node
    } catch (error) {
      logger.error(`Failed to load directory ${resolvedPath}: ${error}`)
      throw error
    }
  }

  /**
   * Get cached directory listing (fast)
   */
  getCachedDirectory(dirPath: string): FileNode | null {
    const resolvedPath = path.resolve(dirPath)
    return this.cache.get(resolvedPath) || null
  }

  /**
   * Get file content from cache or load it
   */
  async getFileContent(filePath: string): Promise<string | Buffer | null> {
    const resolvedPath = path.resolve(filePath)
    const parentDir = path.dirname(resolvedPath)
    const fileName = path.basename(resolvedPath)

    // Check cache first
    const cachedDir = this.cache.get(parentDir)
    if (cachedDir?.children?.has(fileName)) {
      const fileNode = cachedDir.children.get(fileName)
      if (fileNode && fileNode.content !== undefined) {
        return fileNode.content
      }
    }

    // Load from filesystem
    try {
      const stats = await fs.stat(resolvedPath)
      if (stats.isDirectory()) {
        throw new Error(`Path ${resolvedPath} is a directory, not a file`)
      }

      let content: string | Buffer
      if (this.options.includeBinary || this.isTextFile(resolvedPath)) {
        if (stats.size > (this.options.maxFileSize || 1024 * 1024)) {
          logger.log(
            `File ${resolvedPath} too large (${stats.size} bytes), skipping content cache`
          )
          return await fs.readFile(resolvedPath)
        }
        content = await fs.readFile(resolvedPath, 'utf8')
      } else {
        content = await fs.readFile(resolvedPath)
      }

      // Update cache if parent directory is cached
      if (cachedDir?.children?.has(fileName)) {
        const fileNode = cachedDir.children.get(fileName)
        if (fileNode) {
          fileNode.content = content
          fileNode.size = stats.size
          fileNode.lastModified = stats.mtime
        }
      }

      return content
    } catch (error) {
      logger.error(`Failed to read file ${resolvedPath}: ${error}`)
      throw error
    }
  }

  /**
   * Write file content and update cache
   */
  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    const resolvedPath = path.resolve(filePath)
    const parentDir = path.dirname(resolvedPath)
    const fileName = path.basename(resolvedPath)

    try {
      // Ensure parent directory exists
      await fs.mkdir(parentDir, { recursive: true })

      // Write to filesystem
      await fs.writeFile(resolvedPath, content)

      const stats = await fs.stat(resolvedPath)

      // Update cache
      let cachedDir = this.cache.get(parentDir)
      if (!cachedDir) {
        // Create minimal parent directory node if it doesn't exist
        cachedDir = {
          name: path.basename(parentDir),
          path: parentDir,
          isDirectory: true,
          children: new Map(),
        }
        this.cache.set(parentDir, cachedDir)
      }

      const fileNode: FileNode = {
        name: fileName,
        path: resolvedPath,
        isDirectory: false,
        size: stats.size,
        lastModified: stats.mtime,
        content: content,
      }

      if (!cachedDir.children) {
        cachedDir.children = new Map()
      }
      cachedDir.children.set(fileName, fileNode)

      logger.log(`Wrote file ${resolvedPath}`)
      this.emit('fileChanged', resolvedPath, 'write', fileNode)
    } catch (error) {
      logger.error(`Failed to write file ${resolvedPath}: ${error}`)
      throw error
    }
  }

  /**
   * Delete file or directory and update cache
   */
  async delete(targetPath: string): Promise<void> {
    const resolvedPath = path.resolve(targetPath)
    const parentDir = path.dirname(resolvedPath)
    const targetName = path.basename(resolvedPath)

    try {
      const stats = await fs.stat(resolvedPath)

      if (stats.isDirectory()) {
        await fs.rm(resolvedPath, { recursive: true, force: true })
      } else {
        await fs.unlink(resolvedPath)
      }

      // Update cache
      const cachedDir = this.cache.get(parentDir)
      if (cachedDir?.children) {
        cachedDir.children.delete(targetName)
      }

      // Remove from cache if it's a directory
      if (stats.isDirectory()) {
        this.cache.delete(resolvedPath)
      }

      logger.log(
        `Deleted ${stats.isDirectory() ? 'directory' : 'file'} ${resolvedPath}`
      )
      this.emit('fileChanged', resolvedPath, 'delete', null)
    } catch (error) {
      logger.error(`Failed to delete ${resolvedPath}: ${error}`)
      throw error
    }
  }

  /**
   * Create directory and update cache
   */
  async createDirectory(dirPath: string): Promise<void> {
    const resolvedPath = path.resolve(dirPath)
    const parentDir = path.dirname(resolvedPath)
    const dirName = path.basename(resolvedPath)

    try {
      await fs.mkdir(resolvedPath, { recursive: true })

      // Update cache
      let cachedDir = this.cache.get(parentDir)
      if (!cachedDir) {
        cachedDir = {
          name: path.basename(parentDir),
          path: parentDir,
          isDirectory: true,
          children: new Map(),
        }
        this.cache.set(parentDir, cachedDir)
      }

      const dirNode: FileNode = {
        name: dirName,
        path: resolvedPath,
        isDirectory: true,
        children: new Map(),
      }

      if (!cachedDir.children) {
        cachedDir.children = new Map()
      }
      cachedDir.children.set(dirName, dirNode)
      this.cache.set(resolvedPath, dirNode)

      logger.log(`Created directory ${resolvedPath}`)
      this.emit('fileChanged', resolvedPath, 'create', dirNode)
    } catch (error) {
      logger.error(`Failed to create directory ${resolvedPath}: ${error}`)
      throw error
    }
  }

  /**
   * Rename/move file or directory and update cache
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    const resolvedOldPath = path.resolve(oldPath)
    const resolvedNewPath = path.resolve(newPath)

    try {
      await fs.rename(resolvedOldPath, resolvedNewPath)

      // Update cache by removing old and adding new
      const oldParentDir = path.dirname(resolvedOldPath)
      const oldName = path.basename(resolvedOldPath)
      const newParentDir = path.dirname(resolvedNewPath)
      const newName = path.basename(resolvedNewPath)

      // Get the node from old location
      const cachedOldDir = this.cache.get(oldParentDir)
      let nodeToMove: FileNode | undefined

      if (cachedOldDir?.children) {
        nodeToMove = cachedOldDir.children.get(oldName)
        cachedOldDir.children.delete(oldName)
      }

      // Add to new location
      if (nodeToMove) {
        nodeToMove.name = newName
        nodeToMove.path = resolvedNewPath

        let cachedNewDir = this.cache.get(newParentDir)
        if (!cachedNewDir) {
          cachedNewDir = {
            name: path.basename(newParentDir),
            path: newParentDir,
            isDirectory: true,
            children: new Map(),
          }
          this.cache.set(newParentDir, cachedNewDir)
        }

        if (!cachedNewDir.children) {
          cachedNewDir.children = new Map()
        }
        cachedNewDir.children.set(newName, nodeToMove)

        // Update cache key if it's a directory
        if (nodeToMove.isDirectory) {
          this.cache.delete(resolvedOldPath)
          this.cache.set(resolvedNewPath, nodeToMove)
        }
      }

      logger.log(`Renamed ${resolvedOldPath} to ${resolvedNewPath}`)
      this.emit('fileChanged', resolvedOldPath, 'delete', null)
      this.emit('fileChanged', resolvedNewPath, 'create', nodeToMove || null)
    } catch (error) {
      logger.error(
        `Failed to rename ${resolvedOldPath} to ${resolvedNewPath}: ${error}`
      )
      throw error
    }
  }

  /**
   * Copy file or directory
   */
  async copy(sourcePath: string, destinationPath: string): Promise<void> {
    const resolvedSourcePath = path.resolve(sourcePath)
    const resolvedDestPath = path.resolve(destinationPath)

    try {
      await fs.cp(resolvedSourcePath, resolvedDestPath, { recursive: true })

      // If destination parent is cached, refresh it to include the new file/directory
      const destParentDir = path.dirname(resolvedDestPath)
      if (this.cache.has(destParentDir)) {
        await this.refresh(destParentDir)
      }

      logger.log(`Copied ${resolvedSourcePath} to ${resolvedDestPath}`)
    } catch (error) {
      logger.error(
        `Failed to copy ${resolvedSourcePath} to ${resolvedDestPath}: ${error}`
      )
      throw error
    }
  }

  /**
   * Check if file or directory exists
   */
  async exists(targetPath: string): Promise<boolean> {
    const resolvedPath = path.resolve(targetPath)

    try {
      await fs.access(resolvedPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * List files in directory (from cache if available)
   */
  async listFiles(dirPath: string): Promise<FileNode[]> {
    const resolvedPath = path.resolve(dirPath)

    // Check cache first
    const cachedDir = this.cache.get(resolvedPath)
    if (cachedDir?.children) {
      // FlatMap: recursively append children of directories

      return Array.from(cachedDir.children.values())
    }

    // Load from filesystem
    try {
      const readdir = async (resolvedPath: string): Promise<FileNode[]> => {
        const files: FileNode[] = []
        let entries = await fs.readdir(resolvedPath)

        for (const e of entries) {
          const estats = await fs.stat(path.join(resolvedPath, e))
          files.push({
            isDirectory: estats.isDirectory(),
            name: e,
            path: path.join(resolvedPath, e),
            lastModified: estats.mtime,
            size: estats.size,
          } as FileNode)

          if (estats.isDirectory() && this.options.recursive) {
            const children = await readdir(path.join(resolvedPath, e))
            files.push(...children)
          }
        }
        return files
      }

      const files = await readdir(resolvedPath)

      const stats = await fs.stat(resolvedPath)

      this.cache.set(resolvedPath, {
        isDirectory: true,
        name: path.basename(resolvedPath),
        path: resolvedPath,
        lastModified: stats.mtime,
        size: stats.size,
        children: new Map<string, FileNode>(files.map((f) => [f.name, f])),
      } as FileNode)

      return Array.from(files)
    } catch (error) {
      logger.error(`Failed to list files in ${resolvedPath}: ${error}`)
      throw error
    }
  }

  /**
   * Refresh cache for a specific directory
   */
  async refresh(dirPath: string): Promise<FileNode> {
    const resolvedPath = path.resolve(dirPath)
    this.cache.delete(resolvedPath)
    return await this.loadDirectory(resolvedPath)
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear()
    logger.log('Cache cleared')
    this.emit('cacheCleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    directories: number
    totalFiles: number
    cacheSize: number
  } {
    let totalFiles = 0
    let cacheSize = 0

    const countFiles = (node: FileNode): void => {
      if (node.isDirectory && node.children) {
        for (const child of node.children.values()) {
          if (child.isDirectory) {
            countFiles(child)
          } else {
            totalFiles++
            if (child.content) {
              cacheSize += Buffer.isBuffer(child.content)
                ? child.content.length
                : Buffer.byteLength(child.content, 'utf8')
            }
          }
        }
      }
    }

    for (const rootNode of this.cache.values()) {
      countFiles(rootNode)
    }

    return {
      directories: this.cache.size,
      totalFiles,
      cacheSize,
    }
  }

  private async buildDirectoryTree(dirPath: string): Promise<FileNode> {
    const stats = await fs.stat(dirPath)
    const node: FileNode = {
      name: path.basename(dirPath),
      path: dirPath,
      isDirectory: true,
      lastModified: stats.mtime,
      children: new Map(),
    }

    if (!this.options.recursive) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        const childPath = path.join(dirPath, entry.name)
        const childStats = await fs.stat(childPath)

        const childNode: FileNode = {
          name: entry.name,
          path: childPath,
          isDirectory: entry.isDirectory(),
          size: entry.isFile() ? childStats.size : undefined,
          lastModified: childStats.mtime,
        }

        // Load file content if it's small enough and text
        if (
          entry.isFile() &&
          childStats.size <= (this.options.maxFileSize || 1024 * 1024) &&
          (this.options.includeBinary || this.isTextFile(childPath))
        ) {
          try {
            childNode.content = await fs.readFile(childPath, 'utf8')
          } catch (error) {
            logger.error(`Failed to load content for ${childPath}`, error)
          }
        }

        if (node.children) {
          node.children.set(entry.name, childNode)
        }
      }
    } else {
      // Recursive loading
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        const childPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          const childNode = await this.buildDirectoryTree(childPath)
          if (node.children) {
            node.children.set(entry.name, childNode)
          }
        } else {
          const childStats = await fs.stat(childPath)
          const childNode: FileNode = {
            name: entry.name,
            path: childPath,
            isDirectory: false,
            size: childStats.size,
            lastModified: childStats.mtime,
          }

          // Load file content if it's small enough
          if (
            childStats.size <= (this.options.maxFileSize || 1024 * 1024) &&
            (this.options.includeBinary || this.isTextFile(childPath))
          ) {
            try {
              childNode.content = await fs.readFile(childPath, 'utf8')
            } catch (error) {
              logger.error(`Failed to load content for ${childPath}`, error)
            }
          }

          if (node.children) {
            node.children.set(entry.name, childNode)
          }
        }
      }
    }

    return node
  }

  private isTextFile(filePath: string): boolean {
    const textExtensions = [
      '.txt',
      '.md',
      '.json',
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.css',
      '.html',
      '.xml',
      '.yaml',
      '.yml',
      '.ini',
      '.conf',
      '.log',
      '.csv',
      '.sql',
    ]
    const ext = path.extname(filePath).toLowerCase()
    return textExtensions.includes(ext)
  }
}

// Singleton instance
let fileService: FileService | null = null

export async function getFileService(): Promise<FileService> {
  if (!fileService) {
    fileService = new FileService({
      recursive: false,
      includeBinary: false,
      maxFileSize: 1024 * 1024, // 1MB
    })
    await fileService.loadDirectory(DATA_LOCATION) // Preload main data directory
  }

  return fileService
}

// Legacy function exports for backward compatibility
export async function writeFile(
  filePath: string,
  data: string | Buffer
): Promise<void> {
  const service = await getFileService()
  await service.writeFile(filePath, data)
}

export async function readFile(filePath: string): Promise<string | null> {
  const service = await getFileService()
  const content = await service.getFileContent(filePath)
  return typeof content === 'string' ? content : null
}

export async function deleteFileOrDirectory(filePath: string): Promise<void> {
  const service = await getFileService()
  await service.delete(filePath)
}

export async function checkIfExists(filePath: string): Promise<boolean> {
  const service = await getFileService()
  return await service.exists(filePath)
}

export async function listFiles(directoryPath: string): Promise<FileNode[]> {
  const service = await getFileService()
  return await service.listFiles(directoryPath)
}

export async function moveFilesOrDirectory(
  oldPath: string,
  newPath: string
): Promise<void> {
  const service = await getFileService()
  await service.rename(oldPath, newPath)
}

export async function createDirectory(directoryPath: string): Promise<void> {
  const service = await getFileService()
  await service.createDirectory(directoryPath)
}

export async function copyFilesOrDirectory(
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  const service = await getFileService()
  await service.copy(sourcePath, destinationPath)
}
