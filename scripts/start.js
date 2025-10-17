#!/usr/bin/env node
import { spawn } from 'node:child_process'

console.log('Starting BskyBackup application...')

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

// Start the application
async function start() {
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
