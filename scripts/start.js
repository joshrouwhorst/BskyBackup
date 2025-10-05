#!/usr/bin/env node
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

console.log('Starting BskyBackup application...')

// Initialize CronService
async function initializeCronService() {
  try {
    console.log('Initializing CronService...')
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const modulePath = path.resolve(
      __dirname,
      '../src/app/api/services/CronService.js'
    )
    const { ensureCronIsRunning } = await import(modulePath)
    await ensureCronIsRunning()
    console.log('CronService initialized successfully')
  } catch (error) {
    console.error('Failed to initialize CronService:', error)
    // Don't exit - let the app start anyway
  }
}

// Start the application
async function start() {
  await initializeCronService()

  console.log('Starting Next.js server...')
  const server = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    env: process.env,
  })

  server.on('close', (code) => {
    console.log(`Next.js server exited with code ${code}`)
    process.exit(code ?? 0)
  })

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully')
    server.kill('SIGTERM')
  })

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully')
    server.kill('SIGINT')
  })
}

start().catch((error) => {
  console.error('Failed to start application:', error)
  process.exit(1)
})
