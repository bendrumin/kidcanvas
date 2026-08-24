import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'
import { verifyCsrfProtection } from '@/lib/csrf-protection'

/**
 * The support contact form.
 *
 * The form used to POST to Formspree, which our own Content-Security-Policy
 * (connect-src) blocks -- so in production every submission failed in the
 * browser before a request ever left the page. This route sends through
 * Resend instead, which is already DNS-verified on kidcanvas.app and whose
 * key is already in the environment for invite emails.
 */
export async function POST(request: NextRequest) {
  try {
    const csrf = verifyCsrfProtection(request)
    if (!csrf.success) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const identifier = getClientIdentifier(request, 'contact')
    const rate = checkRateLimit(identifier, 'general')
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const name = String(body.name ?? '').trim().slice(0, 100)
    const email = String(body.email ?? '').trim().slice(0, 200)
    const message = String(body.message ?? '').trim().slice(0, 5000)
    // Honeypot: a hidden field humans never fill. Bots that do get a cheerful
    // 200 and nothing is sent.
    if (String(body.company ?? '').trim() !== '') {
      return NextResponse.json({ success: true })
    }

    if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Name, a valid email, and a message are required.' },
        { status: 400 }
      )
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      // Say so honestly instead of pretending it sent -- the invite route made
      // that mistake once already.
      return NextResponse.json(
        { error: 'The contact form is not available right now. Email support@kidcanvas.app instead.' },
        { status: 503 }
      )
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'KidCanvas Contact Form <contact@kidcanvas.app>',
        to: ['support@kidcanvas.app'],
        reply_to: email,
        subject: `Support message from ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error('Contact form send failed:', response.status, detail.slice(0, 300))
      return NextResponse.json(
        { error: 'Could not send your message. Email support@kidcanvas.app instead.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
