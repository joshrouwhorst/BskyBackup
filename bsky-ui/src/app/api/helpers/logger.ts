import fs from 'fs'
import path from 'path'
import { LOGS_PATH } from '@/config'
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

class Logger {
  private static appendLine(message: string) {
    const line = `${formatDate(new Date())} | ${message}\n`
    fs.appendFileSync(getLogFilePath(), line, 'utf-8')
    console.log(line.trim())
  }

  static blank() {
    Logger.appendLine('')
  }

  static blanks(count: number) {
    for (let i = 0; i < count; i++) {
      Logger.blank()
    }
  }

  static divider() {
    Logger.appendLine('----------------------------------------')
  }

  static opening(name: string) {
    Logger.blanks(2)
    Logger.appendLine(`********** START ${name} **********`)
  }

  static closing(name: string) {
    Logger.appendLine(`********** END ${name} **********`)
    Logger.blanks(2)
  }

  static log(message: string, object?: any) {
    Logger.appendLine(message)
    if (object && SHOW_OBJECTS_IN_LOGS) {
      Logger.appendLine(JSON.stringify(object, getCircularReplacer(), 2))
    }
  }

  static error(message: string, error?: any) {
    Logger.appendLine(`ERROR: ${message}`)
    if (error && SHOW_OBJECTS_IN_LOGS) {
      Logger.appendLine(`ERROR DETAILS: ${JSON.stringify(error, getCircularReplacer(), 2)}`)
    }
  }
}

function getCircularReplacer() {
  const seen = new WeakSet();
  return function (key: string, value: any) {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  };
}

export default Logger
