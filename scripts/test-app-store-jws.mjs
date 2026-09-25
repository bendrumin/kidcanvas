#!/usr/bin/env node
// Checks that lib/app-store/jws.ts fails closed.
//
//   node scripts/test-app-store-jws.mjs
//
// Real Apple-signed JWS cannot be minted locally, so this builds a look-alike
// chain with openssl (root -> intermediate -> leaf, carrying Apple's marker
// OIDs) and signs ES256 payloads with it. The first case proves the verifier
// accepts a well-formed chain when told to trust that root; every other case is
// a way an attacker or a bug could get a payload in, and each must be refused.
// The most important one is the second: the same valid-looking JWS, checked
// against the real Apple root, must fail.
//
// Needs Node 22.18+ or 23.6+ (runs the .ts file via type stripping) and openssl.

import { execFileSync } from 'node:child_process'
import { createPrivateKey, sign } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { verifyAppleJws, JwsVerificationError } from '../lib/app-store/jws.ts'

const dir = mkdtempSync(join(tmpdir(), 'kidcanvas-jws-'))
const f = (name) => join(dir, name)
const openssl = (...args) => execFileSync('openssl', args, { cwd: dir, stdio: 'pipe' })

function makeKey(name) {
  openssl('ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', f(`${name}.key`))
}

function makeChain(prefix, { leafOid = true } = {}) {
  writeFileSync(
    f(`${prefix}.ext`),
    [
      '[ca]',
      'basicConstraints=critical,CA:TRUE',
      'keyUsage=critical,keyCertSign,cRLSign',
      '[intermediate]',
      'basicConstraints=critical,CA:TRUE,pathlen:0',
      'keyUsage=critical,keyCertSign,cRLSign',
      '1.2.840.113635.100.6.2.1=ASN1:NULL',
      '[leaf]',
      'basicConstraints=critical,CA:FALSE',
      'keyUsage=critical,digitalSignature',
      ...(leafOid ? ['1.2.840.113635.100.6.11.1=ASN1:NULL'] : []),
      '',
    ].join('\n')
  )
  for (const n of ['root', 'int', 'leaf']) makeKey(`${prefix}-${n}`)
  openssl('req', '-x509', '-new', '-key', f(`${prefix}-root.key`), '-subj', `/CN=${prefix} Test Root`,
    '-days', '30', '-out', f(`${prefix}-root.pem`), '-extensions', 'ca', '-config', f(`${prefix}.cnf`))
  openssl('req', '-new', '-key', f(`${prefix}-int.key`), '-subj', `/CN=${prefix} Test Intermediate`,
    '-out', f(`${prefix}-int.csr`), '-config', f(`${prefix}.cnf`))
  openssl('x509', '-req', '-in', f(`${prefix}-int.csr`), '-CA', f(`${prefix}-root.pem`),
    '-CAkey', f(`${prefix}-root.key`), '-CAcreateserial', '-days', '30',
    '-extfile', f(`${prefix}.ext`), '-extensions', 'intermediate', '-out', f(`${prefix}-int.pem`))
  openssl('req', '-new', '-key', f(`${prefix}-leaf.key`), '-subj', `/CN=${prefix} Test Leaf`,
    '-out', f(`${prefix}-leaf.csr`), '-config', f(`${prefix}.cnf`))
  openssl('x509', '-req', '-in', f(`${prefix}-leaf.csr`), '-CA', f(`${prefix}-int.pem`),
    '-CAkey', f(`${prefix}-int.key`), '-CAcreateserial', '-days', '30',
    '-extfile', f(`${prefix}.ext`), '-extensions', 'leaf', '-out', f(`${prefix}-leaf.pem`))

  const der = (pem) => readFileSync(f(pem), 'utf8').replace(/-----[^-]+-----|\s/g, '')
  return {
    rootPem: readFileSync(f(`${prefix}-root.pem`), 'utf8'),
    x5c: [der(`${prefix}-leaf.pem`), der(`${prefix}-int.pem`), der(`${prefix}-root.pem`)],
    leafKey: createPrivateKey(readFileSync(f(`${prefix}-leaf.key`))),
  }
}

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')

function signJws(chain, payload, header = {}) {
  const h = b64url({ alg: 'ES256', x5c: chain.x5c, ...header })
  const p = b64url(payload)
  const sig = sign('sha256', Buffer.from(`${h}.${p}`), { key: chain.leafKey, dsaEncoding: 'ieee-p1363' })
  return `${h}.${p}.${sig.toString('base64url')}`
}

let failures = 0
function expectPass(name, fn) {
  try {
    fn()
    console.log(`ok    ${name}`)
  } catch (e) {
    failures++
    console.log(`FAIL  ${name}: expected success, got ${e.message}`)
  }
}
function expectReject(name, fn) {
  try {
    fn()
    failures++
    console.log(`FAIL  ${name}: accepted a payload it should have refused`)
  } catch (e) {
    if (e instanceof JwsVerificationError) {
      console.log(`ok    ${name} (${e.message})`)
    } else {
      failures++
      console.log(`FAIL  ${name}: threw ${e?.name} instead of JwsVerificationError: ${e?.message}`)
    }
  }
}

try {
  writeFileSync(f('test.cnf'), '[req]\ndistinguished_name=dn\n[dn]\n[ca]\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\n')
  writeFileSync(f('nooid.cnf'), readFileSync(f('test.cnf')))
  const chain = makeChain('test')
  const noOidChain = makeChain('nooid', { leafOid: false })

  const payload = {
    transactionId: '2000000000000001',
    originalTransactionId: '2000000000000001',
    bundleId: 'Siegel.KidCanvas',
    productId: 'kidcanvas.family.monthly',
    type: 'Auto-Renewable Subscription',
    environment: 'Sandbox',
    signedDate: Date.now(),
    expiresDate: Date.now() + 30 * 864e5,
  }
  const good = signJws(chain, payload)
  const trustTest = { rootCertificates: [chain.rootPem] }

  expectPass('well-formed chain under a trusted test root verifies', () => {
    const out = verifyAppleJws(good, trustTest)
    if (out.productId !== payload.productId) throw new Error('payload did not round-trip')
  })

  expectReject('same JWS against the real Apple root is refused', () => verifyAppleJws(good))

  expectReject('tampered payload is refused', () => {
    const [h, , s] = good.split('.')
    return verifyAppleJws(`${h}.${b64url({ ...payload, productId: 'kidcanvas.pro.yearly' })}.${s}`, trustTest)
  })

  expectReject('corrupted signature is refused', () => {
    const [h, p, s] = good.split('.')
    const bytes = Buffer.from(s, 'base64url')
    bytes[10] ^= 0xff
    return verifyAppleJws(`${h}.${p}.${bytes.toString('base64url')}`, trustTest)
  })

  expectReject('alg "none" is refused', () => {
    const [, p] = good.split('.')
    return verifyAppleJws(`${b64url({ alg: 'none', x5c: chain.x5c })}.${p}.`, trustTest)
  })

  expectReject('alg HS256 is refused', () => verifyAppleJws(signJws(chain, payload, { alg: 'HS256' }), trustTest))

  expectReject('chain without x5c is refused', () => verifyAppleJws(signJws(chain, payload, { x5c: undefined }), trustTest))

  expectReject('leaf without the StoreKit marker OID is refused', () =>
    verifyAppleJws(signJws(noOidChain, payload), { rootCertificates: [noOidChain.rootPem] }))

  expectReject('leaf from one chain under another chain\'s intermediate is refused', () =>
    verifyAppleJws(signJws({ ...noOidChain, x5c: [noOidChain.x5c[0], chain.x5c[1]] }, payload), trustTest))

  expectReject('certificates past their validity are refused', () =>
    verifyAppleJws(good, { ...trustTest, now: new Date(Date.now() + 365 * 864e5) }))

  expectReject('garbage is refused', () => verifyAppleJws('not.a.jws', trustTest))
  expectReject('empty string is refused', () => verifyAppleJws('', trustTest))
} finally {
  rmSync(dir, { recursive: true, force: true })
}

if (failures) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nAll JWS checks passed')
