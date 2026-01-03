# Adding SMTP Environment Variables to Vercel

## Quick Method (Interactive Script)

Run the helper script:
```bash
./add-smtp-env.sh
```

This will prompt you to enter values for each SMTP variable.

## Manual Method

Add each variable individually:

```bash
# SMTP Host (e.g., mail.porkbun.com)
vercel env add SMTP_HOST production

# SMTP Port (e.g., 587 or 465)
vercel env add SMTP_PORT production

# SMTP Username (your full email address)
vercel env add SMTP_USER production

# SMTP Password (your email password)
vercel env add SMTP_PASSWORD production

# From Email (the email address to send from)
vercel env add SMTP_FROM_EMAIL production
```

## For Multiple Environments

If you want to add the same variables to preview and development environments:

```bash
# For preview environment
vercel env add SMTP_HOST preview
vercel env add SMTP_PORT preview
vercel env add SMTP_USER preview
vercel env add SMTP_PASSWORD preview
vercel env add SMTP_FROM_EMAIL preview

# For development environment
vercel env add SMTP_HOST development
vercel env add SMTP_PORT development
vercel env add SMTP_USER development
vercel env add SMTP_PASSWORD development
vercel env add SMTP_FROM_EMAIL development
```

## Verify Variables

To see all your environment variables:
```bash
vercel env ls
```

## Porkbun SMTP Settings

Typical values for Porkbun:
- **SMTP_HOST:** `mail.porkbun.com` or `smtp.porkbun.com`
- **SMTP_PORT:** `587` (TLS) or `465` (SSL)
- **SMTP_USER:** Your full email address (e.g., `invites@yourdomain.com`)
- **SMTP_PASSWORD:** Your email account password
- **SMTP_FROM_EMAIL:** Same as SMTP_USER (e.g., `invites@yourdomain.com`)

Check your Porkbun email hosting settings for the exact values.

