import { NextResponse } from 'next/server'
import { migratePostStructures } from '@/app/api/services/DraftPostService'

export async function GET(request: Request) {
  try {
    await migratePostStructures()
    return NextResponse.json({ message: 'Migration completed' })
  } catch (error) {
    return NextResponse.json(
      {
        error: request.url.includes('/posts/')
          ? 'Failed to fetch post'
          : 'Failed to fetch app data',
      },
      { status: 500 }
    )
  }
}

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
