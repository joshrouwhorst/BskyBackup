#!/usr/bin/env node
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

console.log('Starting BskyBackup application...')

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations')
const APP_INFO_PATH = path.join(process.cwd(), '.migrations.json')
const PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json')

class MigrationService {
  constructor(app) {
    this.app = app
  }

  needToMigrate() {
    return !!this.app.previousVersion
  }

  isPreviousVersionLessThan(version) {
    return this.compareVersions(this.app.previousVersion, version) === -1
  }

  isPreviousVersionGreaterThan(version) {
    return this.compareVersions(this.app.previousVersion, version) === 1
  }

  isVersionLessThan(version) {
    return this.compareVersions(this.app.version, version) === -1
  }

  isVersionGreaterThan(version) {
    return this.compareVersions(this.app.version, version) === 1
  }

  /**
   * Compare two semantic version strings.
   * Returns -1 if second < first, 0 if equal, 1 if second > first.
   */
  compareVersions(first, second) {
    const toNums = (v) =>
      String(v)
        .trim()
        .split('.')
        .map((part) => {
          const m = part.match(/^(\d+)/)
          return m ? parseInt(m[1], 10) : 0
        })

    const a = toNums(first)
    const b = toNums(second)
    const len = Math.max(a.length, b.length)

    for (let i = 0; i < len; i++) {
      const ai = a[i] ?? 0
      const bi = b[i] ?? 0
      if (bi > ai) return 1
      if (bi < ai) return -1
    }
    return 0
  }
}

// Wait for server to be ready by checking port
async function waitForServer(port = 3000, maxAttempts = 30) {
  const net = await import('node:net')

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const socket = new net.Socket()
        socket.setTimeout(1000)
        socket.on('connect', () => {
          socket.destroy()
          resolve()
        })
        socket.on('timeout', () => {
          socket.destroy()
          reject(new Error('Timeout'))
        })
        socket.on('error', reject)
        socket.connect(port, 'localhost')
      })

      console.log(`🚀 Server is ready on port ${port}!`)
      return true
    } catch {
      if (attempt % 5 === 0) {
        console.log(`Waiting for server... (attempt ${attempt}/${maxAttempts})`)
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  throw new Error(`Server not ready after ${maxAttempts} attempts`)
}

// Make initial fetch when server is ready
async function makeInitialFetch() {
  try {
    // Wait for server to be ready
    await waitForServer(3000)

    // Additional small delay to ensure HTTP server is fully ready
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const response = await fetch('http://localhost:3000/api/util?action=init', {
      method: 'POST',
    })

    if (response.ok) {
      console.log('✅ Init successful')
    } else {
      console.log('⚠️ Init failed:', response.status)
    }
  } catch (error) {
    console.error('❌ Initial fetch failed:', error.message)
  }
}

async function signalStop() {
  try {
    // Wait for server to be ready
    await waitForServer(3000)

    // Additional small delay to ensure HTTP server is fully ready
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const response = await fetch(
      'http://localhost:3000/api/util?action=shutdown',
      {
        method: 'POST',
      }
    )

    if (response.ok) {
      console.log('✅ Stop signal successful')
    } else {
      console.log('⚠️ Stop signal failed:', response.status)
    }
  } catch (error) {
    console.error('❌ Stop signal failed:', error.message)
  }
}

// Get metadata from .migrations.json
async function openAppInfo() {
  try {
    let app = null
    const exists = fs.existsSync(APP_INFO_PATH)

    if (!exists) {
      // Initial values
      app = {
        migrations: [],
      }
      fs.writeFileSync(APP_INFO_PATH, JSON.stringify(app, null, 2))
    } else {
      const data = fs.readFileSync(APP_INFO_PATH, 'utf-8')
      app = JSON.parse(data)
    }

    const packageInfo = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'))

    // Add version if missing, this is the project's initial setup
    if (!app.version) {
      app.version = packageInfo.version
      fs.writeFileSync(APP_INFO_PATH, JSON.stringify(app, null, 2))
    }

    // There has been an update, we track what the previous version was
    if (app.version !== packageInfo.version) {
      app.previousVersion = app.version
      app.version = packageInfo.version
      fs.writeFileSync(APP_INFO_PATH, JSON.stringify(app, null, 2))
    }

    return app
  } catch (error) {
    console.error('❌ Could not find .migrations.json:', error.message)
    return
  }
}

// Save metadata to .migrations.json
async function saveAppInfo(app) {
  try {
    fs.writeFileSync(APP_INFO_PATH, JSON.stringify(app, null, 2))
  } catch (error) {
    console.error('❌ Could not save .migrations.json:', error.message)
  }
}

async function runMigrations(app) {
  const previousMigrations = app.migrations || []
  const migrationDir = fs.readdirSync(MIGRATIONS_DIR)
  const migrations = migrationDir.filter((file) => file.endsWith('.js')).sort()
  const service = new MigrationService(app)

  for (const migrationFile of migrations) {
    if (previousMigrations.includes(migrationFile)) {
      continue // Skip already applied migrations
    }

    console.log(`➡️ Running migration: ${migrationFile}`)
    const migrationPath = path.join(MIGRATIONS_DIR, migrationFile)
    try {
      const migration = require(migrationPath)
      if (typeof migration.up === 'function') {
        await migration.up(service)
        console.log(`✅ Migration ${migrationFile} applied successfully`)
        previousMigrations.push(migrationFile)
        app.migrations = previousMigrations
        await saveAppInfo(app)
      } else {
        console.warn(
          `⚠️ Migration ${migrationFile} does not export an 'up' function`
        )
      }
    } catch (error) {
      console.error(`❌ Migration ${migrationFile} failed:`, error)
      throw error // Stop further migrations on failure
    }
  }
}

// Start the application
async function start() {
  console.log('Opening app migration info...')
  const app = await openAppInfo()

  if (!app) {
    throw new Error('Could not open app info')
  }

  console.log('Running migrations if needed...')
  await runMigrations(app)

  console.log('Starting Next.js server...')
  const server = spawn('npm', ['run', 'start'], {
    stdio: ['inherit', 'pipe', 'pipe'], // Pipe stdout and stderr to capture output
    env: process.env,
  })

  let serverReady = false

  // Listen for stdout to detect when server is ready
  server.stdout.on('data', (data) => {
    const output = data.toString()
    process.stdout.write(output) // Still show the output

    // Check for Next.js ready patterns
    if (
      !serverReady &&
      (output.includes('Ready in') ||
        output.includes('ready - started server on') ||
        output.includes('Local:') ||
        output.includes('localhost:3000'))
    ) {
      serverReady = true
      console.log('\n🚀 Server is ready! Making initial fetch...')

      // Make your fetch call here
      makeInitialFetch()
    }
  })

  // Listen for stderr
  server.stderr.on('data', (data) => {
    const output = data.toString()
    process.stderr.write(output) // Still show error output
  })

  // Server events
  server.on('spawn', () => {
    console.log('Next.js server process spawned')
  })

  server.on('error', (error) => {
    console.error('Server process error:', error)
  })

  server.on('close', (code) => {
    console.log(`Next.js server exited with code ${code}`)
    process.exit(code ?? 0)
  })

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    signalStop()
    console.log('Received SIGTERM, shutting down gracefully')
    server.kill('SIGTERM')
  })

  process.on('SIGINT', () => {
    signalStop()
    console.log('Received SIGINT, shutting down gracefully')
    server.kill('SIGINT')
  })
}

start().catch((error) => {
  console.error('Failed to start application:', error)
  process.exit(1)
})
