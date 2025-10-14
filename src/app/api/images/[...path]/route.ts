import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getPaths } from '@/config/main'
import Logger from '../../../api-helpers/logger'

const logger = new Logger('ImagesRoute')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { backupPath, backupMediaPath } = await getPaths()
    const resolvedParams = await params
    const imagePath = path.join(backupMediaPath, ...resolvedParams.path)

    // Security check: ensure the path is within BACKUP_PATH
    const resolvedPath = path.resolve(imagePath)
    const resolvedBackupPath = path.resolve(backupPath)

    if (!resolvedPath.startsWith(resolvedBackupPath)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return new NextResponse('Image not found', { status: 404 })
    }

    // Read the file
    const imageBuffer = fs.readFileSync(resolvedPath)

    // Determine content type based on file extension
    const ext = path.extname(resolvedPath).toLowerCase()
    const contentType = getContentType(ext)

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })
  } catch (error) {
    logger.error('Error serving image:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

function getContentType(ext: string): string {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    default:
      return 'image/jpeg'
  }
}
