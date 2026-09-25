import { X509Certificate, verify as cryptoVerify } from 'node:crypto'

/**
 * Verification of Apple-signed JWS payloads: StoreKit 2 transactions, renewal
 * info, and App Store Server Notifications V2.
 *
 * Apple signs these with ES256 and puts the certificate chain in the header's
 * `x5c` (leaf, intermediate, root). Anyone can build a JWS with an `x5c`, so
 * the chain proves nothing until it ends at a root WE already trust. That is the
 * whole check: the root in the header is ignored, and the intermediate must be
 * issued by the Apple root embedded below.
 *
 * Deliberately dependency-free (node:crypto only) and free of `@/` imports, so
 * scripts/test-app-store-jws.mjs can run it directly with Node's type stripping.
 *
 * Not done: OCSP revocation checks on the leaf. Apple's own server library makes
 * those optional; they would add a network round-trip to every webhook.
 */

/**
 * Apple Root CA - G3.
 *
 * Source: https://www.apple.com/certificateauthority/AppleRootCA-G3.cer
 * (also shipped in macOS: `security find-certificate -c "Apple Root CA - G3" -p
 * /System/Library/Keychains/SystemRootCertificates.keychain`).
 * SHA-256 fingerprint:
 * 63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79
 * Valid until 2039-04-30.
 */
export const APPLE_ROOT_CA_G3_PEM = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----`

// Marker extensions Apple puts on its StoreKit signing certificates. Checking
// them stops a certificate Apple issued for some other purpose (it signs a lot
// of things under this root) from being accepted as a StoreKit signer.
// DER encodings of the OIDs, searched for in the certificate bytes.
const OID_APPLE_WWDR_INTERMEDIATE = Buffer.from('2a864886f76364060201', 'hex') // 1.2.840.113635.100.6.2.1
const OID_APPLE_STOREKIT_LEAF = Buffer.from('2a864886f76364060b01', 'hex') // 1.2.840.113635.100.6.11.1

export class JwsVerificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JwsVerificationError'
  }
}

export interface VerifyOptions {
  /** Trusted roots. Defaults to Apple Root CA - G3; tests pass their own. */
  rootCertificates?: string[]
  /** Clock for certificate validity. Defaults to now. */
  now?: Date
}

let defaultRoots: X509Certificate[] | null = null

function trustedRoots(pems?: string[]): X509Certificate[] {
  if (pems) return pems.map((pem) => new X509Certificate(pem))
  if (!defaultRoots) defaultRoots = [new X509Certificate(APPLE_ROOT_CA_G3_PEM)]
  return defaultRoots
}

function base64UrlDecode(segment: string): Buffer {
  if (!/^[A-Za-z0-9_-]*$/.test(segment)) {
    throw new JwsVerificationError('Malformed base64url segment')
  }
  return Buffer.from(segment, 'base64url')
}

function isWithinValidity(cert: X509Certificate, now: Date): boolean {
  return new Date(cert.validFrom) <= now && now <= new Date(cert.validTo)
}

/**
 * Verifies an Apple-signed JWS and returns its decoded payload. Throws
 * JwsVerificationError on anything unexpected: this function fails closed, and
 * callers must treat any throw as "not from Apple".
 */
export function verifyAppleJws<T = Record<string, unknown>>(
  jws: string,
  options: VerifyOptions = {}
): T {
  if (typeof jws !== 'string' || jws.length === 0 || jws.length > 64 * 1024) {
    throw new JwsVerificationError('Missing or oversized JWS')
  }

  const parts = jws.split('.')
  if (parts.length !== 3) {
    throw new JwsVerificationError('JWS must have three segments')
  }
  const [headerB64, payloadB64, signatureB64] = parts

  let header: { alg?: unknown; x5c?: unknown }
  try {
    header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'))
  } catch {
    throw new JwsVerificationError('Unreadable JWS header')
  }

  // Pin the algorithm. Accepting whatever `alg` says is the classic JWT hole.
  if (header.alg !== 'ES256') {
    throw new JwsVerificationError('Unexpected JWS algorithm')
  }

  const x5c = header.x5c
  if (!Array.isArray(x5c) || x5c.length < 2 || !x5c.every((c) => typeof c === 'string')) {
    throw new JwsVerificationError('Missing certificate chain')
  }

  let leaf: X509Certificate
  let intermediate: X509Certificate
  try {
    leaf = new X509Certificate(Buffer.from(x5c[0], 'base64'))
    intermediate = new X509Certificate(Buffer.from(x5c[1], 'base64'))
  } catch {
    throw new JwsVerificationError('Unparseable certificate in chain')
  }

  const now = options.now ?? new Date()
  const roots = trustedRoots(options.rootCertificates)

  // The chain must end at one of OUR roots. x5c[2], if present, is ignored:
  // trusting it would let anyone sign with a root they made themselves.
  const anchoredRoot = roots.find(
    (root) => intermediate.checkIssued(root) && intermediate.verify(root.publicKey)
  )
  if (!anchoredRoot) {
    throw new JwsVerificationError('Certificate chain does not lead to a trusted root')
  }
  if (!intermediate.ca) {
    throw new JwsVerificationError('Intermediate is not a CA')
  }
  if (!(leaf.checkIssued(intermediate) && leaf.verify(intermediate.publicKey))) {
    throw new JwsVerificationError('Leaf certificate is not issued by the intermediate')
  }

  for (const cert of [leaf, intermediate, anchoredRoot]) {
    if (!isWithinValidity(cert, now)) {
      throw new JwsVerificationError('Certificate outside its validity period')
    }
  }

  if (!intermediate.raw.includes(OID_APPLE_WWDR_INTERMEDIATE)) {
    throw new JwsVerificationError('Intermediate is missing the Apple marker extension')
  }
  if (!leaf.raw.includes(OID_APPLE_STOREKIT_LEAF)) {
    throw new JwsVerificationError('Leaf is missing the StoreKit marker extension')
  }

  // JWS ES256 signatures are raw r||s (IEEE P1363), not DER.
  const signature = base64UrlDecode(signatureB64)
  const signedOk = cryptoVerify(
    'sha256',
    Buffer.from(`${headerB64}.${payloadB64}`, 'ascii'),
    { key: leaf.publicKey, dsaEncoding: 'ieee-p1363' },
    signature
  )
  if (!signedOk) {
    throw new JwsVerificationError('Signature does not match')
  }

  try {
    return JSON.parse(base64UrlDecode(payloadB64).toString('utf8')) as T
  } catch {
    throw new JwsVerificationError('Unreadable JWS payload')
  }
}
