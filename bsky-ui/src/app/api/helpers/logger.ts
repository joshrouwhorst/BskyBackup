import fs from 'fs'
import path from 'path'
import { LOGS_PATH } from '@/config'
import { formatDate } from '@/helpers/utils'

class Logger {
  private lines: { message: string; timestamp: Date }[] = []

  blank() {
    this.lines.push({ message: '', timestamp: new Date() })
  }

  blanks(count: number) {
    for (let i = 0; i < count; i++) {
      this.blank()
    }
  }

  divider() {
    this.lines.push({
      message: '----------------------------------------',
      timestamp: new Date(),
    })
  }

  log(message: string) {
    console.log(message)
    this.lines.push({ message, timestamp: new Date() })
  }

  error(message: string) {
    console.error(message)
    this.lines.push({
      message: `ERROR: ${message}`,
      timestamp: new Date(),
    })
  }

  async save() {
    const filename = `backup-log-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.txt`
    const resolvedPath = path.resolve(LOGS_PATH, filename)
    const dir = path.dirname(resolvedPath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(
      resolvedPath,
      this.lines
        .map((line) => `${formatDate(line.timestamp)} | ${line.message}`)
        .join('\n'),
      'utf-8'
    )
    console.log(`Log saved to ${resolvedPath}`)
  }
}

export default Logger
