import fs from 'fs'
import path from 'path'

export async function saveJsonToFile(
  data: any,
  filePath: string
): Promise<void> {
  // Ensure the directory exists
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function readJsonFromFile<T>(filePath: string): Promise<T | null> {
  if (!fs.existsSync(filePath)) {
    return null
  }
  const fileContent = await fs.promises.readFile(filePath, 'utf-8')
  try {
    const data: T = JSON.parse(fileContent)
    return data
  } catch (error) {
    console.error(`Error parsing JSON from file ${filePath}:`, error)
    return null
  }
}

export async function downloadFile({
  url,
  filePath,
  overwrite = false,
}: {
  url: string
  filePath: string
  overwrite?: boolean
}): Promise<boolean> {
  try {
    // Ensure the directory exists
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Only download if file doesn't exist
    if (!overwrite && !fs.existsSync(filePath)) {
      const response = await fetch(url)
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        fs.writeFileSync(filePath, buffer)
        return true
      }
    }
    return false
  } catch (error) {
    console.error(`Error downloading file from ${url}:`, error)
    return false
  }
}

export function safeName(name: string) {
  // keep alphanumerics, dash, underscore; fallback to timestamp
  const cleaned = name.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-')
  return cleaned || `${Date.now()}`
}

export async function ensureDir(dirPath: string) {
  await fs.promises.mkdir(dirPath, { recursive: true })
}
