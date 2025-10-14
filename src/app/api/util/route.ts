import { NextResponse } from 'next/server'
import { ensureCronIsRunning } from '../services/CronService'
import Logger from '../../api-helpers/logger'

const logger = new Logger('UtilRoute')

// Run app initialization
export async function POST(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const action = searchParams.get('action')

  switch (action) {
    case 'init':
      logger.log('Initialization requested via API.')
      await ensureCronIsRunning()
      return NextResponse.json({ message: 'Initialization started' })

    case 'shutdown': // Just a way for the start.js script to signal shutdown
      logger.log('Shutdown signaled via API.')
      // Implement shutdown logic if needed
      return NextResponse.json({ message: 'Shutdown not implemented' })
    default:
      logger.error('Invalid action for POST /api/util:', action)
      return NextResponse.json(
        { error: 'Invalid action. To initialize, set action=init' },
        { status: 400 }
      )
  }
}

// export async function GET(request: Request) {
//   try {
//     await migratePostStructures()
//     return NextResponse.json({ message: 'Migration completed' })
//   } catch (error) {
//     return NextResponse.json(
//       {
//         error: request.url.includes('/posts/')
//           ? 'Failed to fetch post'
//           : 'Failed to fetch app data',
//       },
//       { status: 500 }
//     )
//   }
// }

// Delete posts within the last hour, used to clean up after accidentally spamming posts
// export async function POST(request: Request) {
//   try {
//     const now = new Date()
//     const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
//     const posts = await getPosts()
//     const newPosts = posts.filter(
//       (p) =>
//         p.post.indexedAt !== undefined &&
//         new Date(p.post.indexedAt) > oneHourAgo
//     )

//     const uris = newPosts.map((p) => p.post.uri)

//     await deletePostsWithUris(uris)

//     return NextResponse.json({ newPosts, count: newPosts.length })
//   } catch (error) {
//     return NextResponse.json(
//       {
//         error: request.url.includes('/posts/')
//           ? 'Failed to fetch post'
//           : 'Failed to fetch app data',
//       },
//       { status: 500 }
//     )
//   }
// }
