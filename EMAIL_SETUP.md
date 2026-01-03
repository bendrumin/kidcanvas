# Email Setup Guide

This app supports sending invite emails via SMTP (Porkbun, Gmail, etc.) or Resend API.

## Option 1: Porkbun Email (SMTP) - Recommended

If you have a Porkbun email hosting account, you can use it to send emails directly.

### Setup Steps:

1. **Get your SMTP settings from Porkbun:**
   - Log into your Porkbun account
   - Navigate to Email Hosting settings
   - Find your SMTP server details (typically):
     - **Host:** `mail.porkbun.com` or `smtp.porkbun.com`
     - **Port:** `587` (TLS) or `465` (SSL)
     - **Username:** Your full email address (e.g., `invites@yourdomain.com`)
     - **Password:** Your email account password

2. **Add to your environment variables:**
   ```env
   SMTP_HOST=mail.porkbun.com
   SMTP_PORT=587
   SMTP_USER=invites@yourdomain.com
   SMTP_PASSWORD=your-email-password
   SMTP_FROM_EMAIL=invites@yourdomain.com
   ```

3. **That's it!** The app will automatically use SMTP when these variables are set.

## Option 2: Resend API

Alternatively, you can use Resend (a modern email API service).

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to environment variables:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=invites@yourdomain.com
   ```

## Testing

When you create an invite with an email address, the system will:
- Use SMTP if configured (checks first)
- Fall back to Resend if SMTP not configured
- Log to console if neither is configured (development mode)

## Troubleshooting

**SMTP not working?**
- Verify your SMTP credentials are correct
- Check that port 587 (TLS) or 465 (SSL) is not blocked
- Ensure your Porkbun email account is active
- Check server logs for detailed error messages

**Email not sending?**
- Check that `SMTP_USER` matches your full email address
- Verify `SMTP_PASSWORD` is correct
- Try port 465 with SSL if 587 doesn't work

