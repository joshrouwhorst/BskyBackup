import { OAuthClient } from '@atproto/oauth-client'
import { JoseKey } from '@atproto/jwk-jose'
import type { Key, InternalStateData, Session } from '@atproto/oauth-client'
import { getAppData, saveAppData } from './appData'
import Logger from './logger'

const logger = new Logger('BskyClient')

// Dynamic URL detection for Docker/NAS deployment
function getClientUrl(): string {
  // 1. Explicit environment variable (recommended for production)
  if (process.env.BSKY_BACKUP_URL) {
    return process.env.BSKY_BACKUP_URL
  }

  // 2. Standard deployment URLs
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 3. Docker/NAS server detection
  if (process.env.NODE_ENV === 'production') {
    // Try to detect from common Docker/NAS patterns
    const hostname = process.env.HOSTNAME || process.env.HOST
    const port = process.env.PORT || '3000'

    // If we have a hostname that looks like a NAS/local network
    if (hostname && (hostname.includes('.local') || hostname.includes('.'))) {
      return `https://${hostname}:${port}`
    }

    // Docker internal hostname detection
    if (hostname && !hostname.includes('localhost')) {
      return `https://${hostname}:${port}`
    }

    // Fallback: use the container's external port mapping
    // This assumes you're running with -p hostPort:3000
    const externalPort =
      process.env.EXTERNAL_PORT || process.env.PUBLIC_PORT || port
    return `https://127.0.0.1:${externalPort}`
  }

  // 4. Development fallback
  return 'https://127.0.0.1:3000'
}

const CLIENT_URL = getClientUrl()

const locks = new Map<string, Promise<unknown>>()

async function createOAuthClient(): Promise<OAuthClient> {
  let keys: { RS256: Key; ES256: Key } | null = null
  try {
    const appData = await getAppData()
    const savedKeys = appData.oauthKeys

    if (savedKeys?.ES256 && savedKeys?.RS256) {
      // Load saved keys
      keys = savedKeys
    } else {
      // Generate new keys

      keys = {
        RS256: await JoseKey.generate(['RS256']),
        ES256: await JoseKey.generate(['ES256']),
      }

      // Save keys to disk
      appData.oauthKeys = keys
      await saveAppData(appData)
    }
  } catch (error) {
    logger.error('Error handling OAuth keys:', error)
    throw error
  }

  return new OAuthClient({
    // Use a public resolver for AT Protocol handles
    handleResolver: 'https://plc.directory',
    responseMode: 'query', // Works well for Next.js API routes

    // Client metadata for your BskyBackup app
    clientMetadata: {
      client_id: `${CLIENT_URL}/api/oauth/client-metadata`,
      client_name: 'BskyBackup',
      client_uri: CLIENT_URL,
      redirect_uris: [`${CLIENT_URL}/api/oauth/callback`],
      scope: 'atproto transition:generic',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      application_type: 'web',
      token_endpoint_auth_method: 'private_key_jwt',
      jwks_uri: `${CLIENT_URL}/api/oauth/jwks`,
    },

    runtimeImplementation: {
      // A runtime specific implementation of the crypto operations needed by the
      // OAuth client. The following example is suitable for use in NodeJS.

      createKey(algs: string[]): Promise<Key> {
        // Generate a key with the preferred algorithm
        return JoseKey.generate(algs)
      },

      getRandomValues(length: number): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(length))
      },

      async digest(
        bytes: Uint8Array,
        algorithm: { name: string }
      ): Promise<Uint8Array> {
        const getBufferSource = (bytes: Uint8Array): BufferSource => {
          // sha256 is required. Unsupported algorithms should throw an error.
          return bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength
          ) as BufferSource
        }
        if (algorithm.name.startsWith('sha')) {
          const subtleAlgo = `SHA-${algorithm.name.slice(3)}`
          const buffer = await crypto.subtle.digest(
            subtleAlgo,
            getBufferSource(bytes)
          )
          return new Uint8Array(buffer)
        }

        throw new TypeError(`Unsupported algorithm: ${algorithm.name}`)
      },

      requestLock: async <T>(
        name: string,
        fn: () => T | PromiseLike<T>
      ): Promise<T> => {
        // This function is used to prevent concurrent refreshes of the same
        // credentials. Simple in-memory lock implementation.

        const current = locks.get(name) || Promise.resolve()
        const next = current
          .then(async () => await fn())
          .catch(() => {})
          .finally(() => {
            if (locks.get(name) === next) locks.delete(name)
          })

        locks.set(name, next)
        return next as Promise<T>
      },
    },

    stateStore: {
      // A store for saving state data while the user is being redirected to the
      // authorization server. In production, use a proper database.

      async set(key: string, internalState: InternalStateData): Promise<void> {
        const appData = await getAppData()
        if (!appData.bskyState) appData.bskyState = {}
        appData.bskyState[key] = internalState
        await saveAppData(appData)
      },
      async get(key: string): Promise<InternalStateData | undefined> {
        const appData = await getAppData()
        return appData.bskyState?.[key]
      },
      async del(key: string): Promise<void> {
        const appData = await getAppData()
        if (appData.bskyState) delete appData.bskyState[key]
        await saveAppData(appData)
      },
    },

    sessionStore: {
      // A store for saving session data. In production, use a proper database.

      async set(sub: string, session: Session): Promise<void> {
        const appData = await getAppData()
        const sessionMap = appData.bskySession || {}
        sessionMap[sub] = session
        appData.bskySession = sessionMap
        await saveAppData(appData)
      },
      async get(sub: string): Promise<Session | undefined> {
        const appData = await getAppData()
        return appData.bskySession?.[sub]
      },
      async del(sub: string): Promise<void> {
        const appData = await getAppData()
        if (appData.bskySession) delete appData.bskySession[sub]
        await saveAppData(appData)
      },
    },

    keyset: [keys.RS256, keys.ES256],
  })
}

// Export a singleton instance
let oauthClientInstance: OAuthClient | null = null

export async function getOAuthClient(): Promise<OAuthClient> {
  if (!oauthClientInstance) {
    oauthClientInstance = await createOAuthClient()
  }
  return oauthClientInstance
}
