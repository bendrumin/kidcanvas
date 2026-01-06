import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, inviteLink, familyName, nickname } = body

    if (!email || !inviteLink) {
      return NextResponse.json({ error: 'Email and invite link required' }, { status: 400 })
    }

    // Check for SMTP configuration (Porkbun email)
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD
    const smtpFrom = process.env.SMTP_FROM_EMAIL || smtpUser

    // Check for Resend API key (alternative)
    const resendApiKey = process.env.RESEND_API_KEY

    // If no email service configured, log and return success (for development)
    if (!smtpHost && !resendApiKey) {
      console.log('Email would be sent:', {
        to: email,
        subject: `You're invited to join ${familyName} on KidCanvas!`,
        inviteLink,
      })
      return NextResponse.json({ 
        success: true, 
        message: 'Email service not configured. Email logged to console.' 
      })
    }

    // Send email using Resend
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFF7ED; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFF7ED;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #2ECC71, #3498DB); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">🎉</span>
              </div>
              <h1 style="margin: 20px 0 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">
                You're Invited!
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a; text-align: center;">
                ${nickname ? `Hi ${nickname},<br><br>` : ''}You've been invited to join <strong style="color: #E91E63;">${familyName}</strong> on <strong style="color: #E91E63;">KidCanvas</strong> — the beautiful way to preserve and share your children's artwork!
              </p>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4a4a4a; text-align: center;">
                Click below to accept the invitation and start viewing precious masterpieces. 🖼️
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(90deg, #2ECC71, #3498DB); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(46, 204, 113, 0.4);">
                      Accept Invitation 🎨
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px 40px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #888888; text-align: center;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #aaaaaa;">
                  🎨 KidCanvas — Made with ❤️ for families
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Use SMTP if configured (Porkbun email)
    if (smtpHost && smtpUser && smtpPassword) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort || '587'),
          secure: smtpPort === '465', // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
        })

        const info = await transporter.sendMail({
          from: smtpFrom || smtpUser,
          to: email,
          subject: `You're invited to join ${familyName} on KidCanvas! 🎨`,
          html: emailHtml,
        })

        return NextResponse.json({ 
          success: true, 
          messageId: info.messageId,
          method: 'SMTP'
        })
      } catch (smtpError) {
        console.error('SMTP error:', smtpError)
        return NextResponse.json(
          { error: 'Failed to send email via SMTP', details: smtpError instanceof Error ? smtpError.message : 'Unknown error' },
          { status: 500 }
        )
      }
    }

    // Fall back to Resend if SMTP not configured
    if (resendApiKey) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'KidCanvas <invites@kidcanvas.app>',
          to: email,
          subject: `You're invited to join ${familyName} on KidCanvas! 🎨`,
          html: emailHtml,
        }),
      })

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json().catch(() => ({}))
        console.error('Resend API error:', errorData)
        return NextResponse.json(
          { error: 'Failed to send email', details: errorData },
          { status: 500 }
        )
      }

      const result = await resendResponse.json()
      return NextResponse.json({ 
        success: true, 
        messageId: result.id,
        method: 'Resend'
      })
    }
  } catch (error) {
    console.error('Send invite email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Route segment config
export const maxDuration = 10

