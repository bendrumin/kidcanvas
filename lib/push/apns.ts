import http2 from 'node:http2'
import crypto from 'node:crypto'

// Talks to Apple Push Notification service directly over HTTP/2 with
// token-based auth. Node ships both http2 and ES256 signing, so this needs no
// dependency and no certificate that expires every year.

export type ApnsEnvironment = 'sandbox' | 'production'

export type ApnsResult = {
  token: string
  status: number
  reason?: string
}

const HOSTS: Record<ApnsEnvironment, string> = {
  sandbox: 'https://api.sandbox.push.apple.com',
  production: 'https://api.push.apple.com',
}

type ApnsConfig = { keyId: string; teamId: string; key: string; bundleId: string }

export function readApnsConfig(): ApnsConfig | null {
  const keyId = process.env.APNS_KEY_ID
  const teamId = process.env.APNS_TEAM_ID
  const rawKey = process.env.APNS_KEY
  const bundleId = process.env.APNS_BUNDLE_ID
  if (!keyId || !teamId || !rawKey || !bundleId) return null
  // Pasting a multi-line .p8 into a dashboard often stores it with literal
  // "\n" sequences, which crypto cannot parse as PEM.
  const key = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey
  return { keyId, teamId, key, bundleId }
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

// Apple rejects a provider token older than an hour, and answers
// TooManyProviderTokenUpdates if a new one is minted more than about every 20
// minutes. Reusing one for 40 minutes stays inside both limits, across every
// request a warm serverless instance handles.
const TOKEN_TTL_MS = 40 * 60 * 1000
let cachedJwt: { value: string; keyId: string; issuedAt: number } | null = null

export function providerToken(config: ApnsConfig, now = Date.now()): string {
  if (cachedJwt && cachedJwt.keyId === config.keyId && now - cachedJwt.issuedAt < TOKEN_TTL_MS) {
    return cachedJwt.value
  }
  const header = base64url(JSON.stringify({ alg: 'ES256', kid: config.keyId }))
  const claims = base64url(JSON.stringify({ iss: config.teamId, iat: Math.floor(now / 1000) }))
  const signingInput = `${header}.${claims}`
  // JWS wants the raw r||s signature, not the DER encoding node defaults to.
  const signature = crypto.sign('sha256', Buffer.from(signingInput), {
    key: config.key,
    dsaEncoding: 'ieee-p1363',
  })
  const value = `${signingInput}.${base64url(signature)}`
  cachedJwt = { value, keyId: config.keyId, issuedAt: now }
  return value
}

function sendOne(
  session: http2.ClientHttp2Session,
  jwt: string,
  bundleId: string,
  token: string,
  body: string,
  collapseId?: string,
): Promise<ApnsResult> {
  return new Promise((resolve) => {
    const headers: http2.OutgoingHttpHeaders = {
      ':method': 'POST',
      ':path': `/3/device/${token}`,
      authorization: `bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    }
    if (collapseId) headers['apns-collapse-id'] = collapseId

    const req = session.request(headers)
    let status = 0
    let data = ''
    req.setEncoding('utf8')
    req.setTimeout(8000, () => req.close(http2.constants.NGHTTP2_CANCEL))
    req.on('response', (h) => {
      status = Number(h[':status'] ?? 0)
    })
    req.on('data', (chunk: string) => {
      data += chunk
    })
    req.on('end', () => {
      let reason: string | undefined
      if (data) {
        try {
          reason = (JSON.parse(data) as { reason?: string }).reason
        } catch {
          reason = data
        }
      }
      resolve({ token, status, reason })
    })
    req.on('error', (err) => resolve({ token, status: 0, reason: err.message }))
    req.end(body)
  })
}

/**
 * Sends one payload to many devices in one environment over a single HTTP/2
 * connection. Never throws: every device gets a result, so one bad token
 * cannot stop the rest of the family from hearing about it.
 */
export async function sendToDevices(
  config: ApnsConfig,
  environment: ApnsEnvironment,
  tokens: string[],
  payload: object,
  collapseId?: string,
): Promise<ApnsResult[]> {
  if (tokens.length === 0) return []
  const jwt = providerToken(config)
  const body = JSON.stringify(payload)

  let session: http2.ClientHttp2Session
  try {
    session = http2.connect(HOSTS[environment])
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    return tokens.map((token) => ({ token, status: 0, reason }))
  }
  // A connection-level failure would otherwise be an unhandled 'error' event
  // and crash the function; the per-request handlers report it instead.
  session.on('error', () => {})

  try {
    return await Promise.all(
      tokens.map((token) => sendOne(session, jwt, config.bundleId, token, body, collapseId)),
    )
  } finally {
    session.close()
  }
}

/**
 * True when Apple says this token will never work again, so the row should be
 * deleted rather than retried. 410 is an uninstalled app. BadDeviceToken is
 * usually a token sent to the wrong environment; the app re-registers with the
 * right one on its next launch, so dropping it loses nothing.
 */
export function isDeadToken(result: ApnsResult): boolean {
  if (result.status === 410) return true
  return result.status === 400 && (result.reason === 'BadDeviceToken' || result.reason === 'DeviceTokenNotForTopic')
}
