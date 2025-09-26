import fs from 'fs'
import path from 'path'
import { LOGS_PATH } from '@/config/main'
import { formatDate } from '@/helpers/utils'

const SHOW_OBJECTS_IN_LOGS = false // Set to false to disable logging objects

function getLogFilePath(): string {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0] // e.g., "2024-06-09"
  const filename = `backup-log-${dateStr}.txt`
  const resolvedPath = path.resolve(LOGS_PATH, filename)
  const dir = path.dirname(resolvedPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return resolvedPath
}

function padName(name: string): string {
  if (name.length >= 10) return name.slice(0, 10)
  return name + ' '.repeat(10 - name.length)
}

class Logger {
  private name: string

  constructor(name: string) {
    this.name = padName(name)
  }

  private appendLine(message: string) {
    const line = `${formatDate(new Date())} | ${this.name} | ${message}\n`
    fs.appendFileSync(getLogFilePath(), line, 'utf-8')
    console.log(line.trim())
  }

  blank() {
    this.appendLine('')
  }

  blanks(count: number) {
    for (let i = 0; i < count; i++) {
      this.blank()
    }
  }

  divider() {
    this.appendLine('----------------------------------------')
  }

  opening(section: string) {
    this.blanks(2)
    this.appendLine(`********** START ${section} **********`)
  }

  closing(section: string) {
    this.appendLine(`********** END ${section} **********`)
    this.blanks(2)
  }

  log(message: string, object?: any) {
    this.appendLine(message)
    if (object && SHOW_OBJECTS_IN_LOGS) {
      this.appendLine(JSON.stringify(object, getCircularReplacer(), 2))
    }
  }

  error(message: string, error?: any) {
    this.appendLine(`ERROR: ${message}`)
    if (error && SHOW_OBJECTS_IN_LOGS) {
      this.appendLine(
        `ERROR DETAILS: ${JSON.stringify(error, getCircularReplacer(), 2)}`
      )
    }
  }
}

function getCircularReplacer() {
  const seen = new WeakSet()
  return function (key: string, value: any) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
    }
    return value
  }
}

export default Logger
