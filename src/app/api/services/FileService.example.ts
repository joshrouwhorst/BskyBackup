// // Example usage of the FileService

// import { FileService, getFileService } from '../services/FileService'

// // Example 1: Using the singleton service with default options
// async function basicExample() {
//   const fileService = getFileService()

//   // Load a directory into cache
//   const directoryNode = await fileService.loadDirectory(
//     '/path/to/your/directory'
//   )
//   console.log('Loaded directory:', directoryNode.name)

//   // Get cached directory listing (very fast)
//   const cachedDir = fileService.getCachedDirectory('/path/to/your/directory')
//   if (cachedDir?.children) {
//     console.log('Files in directory:', Array.from(cachedDir.children.keys()))
//   }

//   // Read file content (from cache if available)
//   const content = await fileService.getFileContent('/path/to/your/file.txt')
//   console.log('File content:', content)

//   // Write a new file
//   await fileService.writeFile('/path/to/new/file.txt', 'Hello, World!')

//   // Create a directory
//   await fileService.createDirectory('/path/to/new/directory')

//   // Copy a file
//   await fileService.copy('/path/to/source.txt', '/path/to/destination.txt')

//   // Rename/move a file
//   await fileService.rename('/path/to/old-name.txt', '/path/to/new-name.txt')

//   // Delete a file
//   await fileService.delete('/path/to/file-to-delete.txt')

//   // Get cache statistics
//   const stats = fileService.getCacheStats()
//   console.log('Cache stats:', stats)
// }

// // Example 2: Creating a custom service with specific options
// async function customServiceExample() {
//   const customService = new FileService({
//     recursive: true, // Load directories recursively
//     includeBinary: false, // Don't load binary files into content cache
//     maxFileSize: 512 * 1024, // Only cache files smaller than 512KB
//   })

//   // Listen for file system events
//   customService.on('directoryLoaded', (path) => {
//     console.log(`Directory loaded: ${path}`)
//   })

//   customService.on('fileChanged', (path, action) => {
//     console.log(`File ${action}: ${path}`)
//   })

//   customService.on('cacheCleared', () => {
//     console.log('Cache was cleared')
//   })

//   // Load and work with files
//   await customService.loadDirectory('/path/to/project')

//   // Fast cached operations
//   const projectFiles = customService.getCachedDirectory('/path/to/project')
//   if (projectFiles?.children) {
//     for (const [name, fileNode] of projectFiles.children) {
//       if (!fileNode.isDirectory && fileNode.content) {
//         console.log(
//           `Cached content for ${name}: ${fileNode.content.length} chars`
//         )
//       }
//     }
//   }

//   // Refresh cache when needed
//   await customService.refresh('/path/to/project')

//   // Clear all cache
//   customService.clearCache()
// }

// // Example 3: Using legacy function exports for backward compatibility
// async function legacyExample() {
//   // These functions use the singleton service internally
//   const {
//     writeFile: write,
//     readFile: read,
//     delete: deleteFile,
//     checkIfExists: exists,
//     listFiles,
//     moveFilesOrDirectory: move,
//     copyFilesOrDirectory: copy,
//   } = await import('../services/FileService')

//   // Check if file exists
//   const fileExists = await exists('/path/to/file.txt')
//   console.log('File exists:', fileExists)

//   // List files in directory
//   const files = await listFiles('/path/to/directory')
//   console.log('Files:', files)

//   // Read file content
//   const content = await read('/path/to/file.txt')
//   console.log('Content:', content)

//   // Write file
//   await write('/path/to/new-file.txt', 'New content')

//   // Copy file
//   await copy('/path/to/source.txt', '/path/to/copy.txt')

//   // Move file
//   await move('/path/to/old.txt', '/path/to/new.txt')

//   // Delete file
//   await deleteFile('/path/to/unwanted.txt')
// }

// // Example 4: Working with the cache for fast operations
// async function cacheExample() {
//   const service = getFileService({
//     recursive: true,
//     maxFileSize: 1024 * 1024, // 1MB
//   })

//   // Load a large directory tree
//   console.log('Loading directory tree...')
//   await service.loadDirectory('/path/to/large/project')

//   // Now all subsequent operations on cached files are very fast
//   console.log('Performing fast cached operations...')

//   // Fast directory listing
//   const srcDir = service.getCachedDirectory('/path/to/large/project/src')
//   if (srcDir?.children) {
//     console.log('Source files:', Array.from(srcDir.children.keys()))

//     // Fast content access for small files
//     for (const [name, node] of srcDir.children) {
//       if (!node.isDirectory && node.content && name.endsWith('.js')) {
//         console.log(`${name}: ${node.content.length} characters`)
//       }
//     }
//   }

//   // File modifications update the cache automatically
//   await service.writeFile(
//     '/path/to/large/project/src/new-file.js',
//     'console.log("Hello")'
//   )

//   // Cache is automatically updated
//   const updatedDir = service.getCachedDirectory('/path/to/large/project/src')
//   console.log(
//     'Updated file list:',
//     Array.from(updatedDir?.children?.keys() || [])
//   )
// }

// export { basicExample, customServiceExample, legacyExample, cacheExample }
