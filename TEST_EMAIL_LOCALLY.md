# Testing Email on Localhost

## Option 1: Pull from Vercel (Easiest)

If you've already added the SMTP variables to Vercel, you can pull them:

```bash
vercel env pull .env.local
```

This will add all your Vercel environment variables (including SMTP) to `.env.local`.

## Option 2: Add Manually

Add these lines to your `.env.local` file:

```env
# SMTP Configuration (Porkbun)
SMTP_HOST=mail.porkbun.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=your-email@yourdomain.com
```

Replace with your actual Porkbun email credentials.

## Testing

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Create an invite with an email:**
   - Go to your family page
   - Click "Invite Member"
   - Choose "Send Email Invite"
   - Fill in the email address
   - Submit

3. **Check the console/logs:**
   - If SMTP is configured, you'll see the email being sent
   - If not configured, you'll see a log message with the email details

4. **Check the recipient's inbox:**
   - The email should arrive within a few seconds
   - Check spam folder if not in inbox

## Troubleshooting

**Email not sending?**
- Verify SMTP credentials are correct
- Check that port 587 (TLS) or 465 (SSL) is not blocked by your firewall
- Check server console for error messages
- Try port 465 with SSL if 587 doesn't work

**Want to test without actually sending?**
- Remove or comment out the SMTP variables
- The system will log the email details to console instead

