# Add SMTP Variables to Vercel

Run these commands one by one. The CLI will prompt you to enter the value for each:

```bash
# SMTP Host (e.g., mail.porkbun.com)
vercel env add SMTP_HOST production

# SMTP Port (e.g., 587 or 465)
vercel env add SMTP_PORT production

# SMTP Username (your full email address)
vercel env add SMTP_USER production

# SMTP Password (your email password - mark as sensitive when prompted)
vercel env add SMTP_PASSWORD production

# From Email (the email address to send from)
vercel env add SMTP_FROM_EMAIL production
```

## Quick Copy-Paste

```bash
vercel env add SMTP_HOST production && \
vercel env add SMTP_PORT production && \
vercel env add SMTP_USER production && \
vercel env add SMTP_PASSWORD production && \
vercel env add SMTP_FROM_EMAIL production
```

## Typical Porkbun Values

- **SMTP_HOST:** `mail.porkbun.com` or `smtp.porkbun.com`
- **SMTP_PORT:** `587` (TLS) or `465` (SSL)
- **SMTP_USER:** Your full email (e.g., `invites@yourdomain.com`)
- **SMTP_PASSWORD:** Your email account password
- **SMTP_FROM_EMAIL:** Same as SMTP_USER

## Verify

After adding, verify they're there:
```bash
vercel env ls | grep SMTP
```

