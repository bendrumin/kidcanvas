# Supabase Custom SMTP Setup

To change the FROM email address for Supabase authentication emails (signup confirmations, password resets, etc.) and improve delivery, you need to configure custom SMTP in your Supabase dashboard.

## Why This is Needed

- **Default Supabase emails** come from `noreply@mail.app.supabase.io`
- **Default service has low rate limits** and may not deliver reliably
- **Custom SMTP** allows you to use your own domain (e.g., `support@kidcanvas.app`)

## Setup Steps

### 1. Get Your Porkbun SMTP Settings

From your Porkbun email hosting account:
- **SMTP Host:** `mail.porkbun.com` or `smtp.porkbun.com`
- **SMTP Port:** `587` (STARTTLS) or `465` (TLS/SSL)
- **SMTP User:** Your full email address (e.g., `support@kidcanvas.app`)
- **SMTP Password:** Your email account password
- **Sender Email:** Same as SMTP User (e.g., `support@kidcanvas.app`)

### 2. Configure in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Auth** → **SMTP Settings**
4. Enable **Custom SMTP**
5. Fill in the following:

   ```
   SMTP Host: mail.porkbun.com (or smtp.porkbun.com)
   SMTP Port: 587 (STARTTLS) or 465 (SSL)
   SMTP User: support@kidcanvas.app (FULL email address - required!)
   SMTP Password: [your email password - no spaces!]
   SMTP Admin Email: support@kidcanvas.app (sender address)
   ```

6. **Important Notes:**
   - SMTP User MUST be your full email address (not just username)
   - Password must have no leading/trailing spaces
   - Try port 587 first, if that fails try 465
   - Security should match: STARTTLS for 587, SSL for 465

7. Click **Save**

### Troubleshooting Authentication Errors

If you get `"535 5.7.8 Error: authentication failed"`:

1. **Verify credentials:**
   - Try logging into Porkbun webmail with the same email/password
   - If webmail login fails, reset your password

2. **Check username format:**
   - Must be full email: `support@kidcanvas.app` ✅
   - NOT just: `support` ❌

3. **Try different port:**
   - If 587 doesn't work, try 465 (with SSL)
   - If 465 doesn't work, try 587 (with STARTTLS)

4. **Check for app passwords:**
   - Some providers require app-specific passwords
   - Check Porkbun email settings for this option

5. **See `SUPABASE_SMTP_AUTH_FIX.md` for detailed troubleshooting**

### 3. Test the Configuration

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Send Test Email** (if available)
3. Or create a test signup to verify emails are sent from your custom address

### 4. Verify Email Templates

Make sure your email templates are set up:
1. Go to **Authentication** → **Email Templates**
2. Verify the "Confirm signup" template is configured
3. Check that the confirmation URL redirects to: `/auth/verify-email`

## Troubleshooting

**Emails still not arriving?**
- Check spam/junk folder
- Verify SMTP credentials are correct
- Check Supabase logs: **Logs** → **Auth Logs**
- Ensure port 587 or 465 is not blocked
- Try port 465 with SSL if 587 doesn't work

**FROM address still showing Supabase?**
- Make sure "SMTP Admin Email" is set correctly
- Wait a few minutes for changes to propagate
- Clear browser cache and check again

**Rate limits?**
- Supabase default service: ~3 emails/hour
- Custom SMTP: Depends on your provider (Porkbun typically allows much more)

## Alternative: Use Resend

If you prefer a modern email API instead of SMTP:

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Get your API key
4. Configure in Supabase:
   - Use Resend's SMTP settings (found in their dashboard)
   - Or use their API (requires custom implementation)

## Notes

- **Custom SMTP applies to ALL Supabase auth emails** (signup, password reset, magic links, etc.)
- **Invite emails** (from our app) use the separate SMTP configuration in Vercel
- **Both can use the same Porkbun email account** if desired

