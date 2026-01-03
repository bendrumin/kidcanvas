# Fix: Supabase Email Timeout Error

## The Error

```
"error": "context deadline exceeded"
"msg": "504: Processing this request timed out, please retry after a moment."
"action": "user_confirmation_requested"
```

This means Supabase is timing out when trying to send confirmation emails. This is a common issue with Supabase's default email service.

## Immediate Solutions

### Solution 1: Configure Custom SMTP (Recommended)

This is the best long-term fix. Follow the steps in `SUPABASE_SMTP_SETUP.md`:

1. Go to Supabase Dashboard → Settings → Auth → SMTP Settings
2. Enable Custom SMTP
3. Use your Porkbun email credentials:
   - **SMTP Host:** `mail.porkbun.com`
   - **SMTP Port:** `587`
   - **SMTP User:** `support@kidcanvas.app`
   - **SMTP Password:** [your password]
   - **SMTP Admin Email:** `support@kidcanvas.app`

This will:
- ✅ Fix the timeout issue (Porkbun is more reliable)
- ✅ Change FROM address to your domain
- ✅ Improve delivery rates

### Solution 2: Temporarily Disable Email Confirmation (Development Only)

**⚠️ WARNING: Only for development/testing. Not recommended for production.**

1. Go to Supabase Dashboard → Settings → Auth
2. Under "Email Auth", toggle OFF "Enable email confirmations"
3. Users will be auto-confirmed (no email needed)

**Re-enable this after setting up custom SMTP!**

### Solution 3: Check Supabase Status

1. Check [Supabase Status Page](https://status.supabase.com/)
2. Look for any email service outages
3. If there's an outage, wait for it to resolve

## Why This Happens

- **Supabase default email service** has:
  - Low rate limits (~3 emails/hour)
  - Slow response times
  - Frequent timeouts
  - Poor deliverability

- **Custom SMTP** (like Porkbun) provides:
  - Higher rate limits
  - Faster delivery
  - Better reliability
  - Your own domain

## Testing After Fix

1. Try signing up a new user
2. Check Supabase Auth Logs for errors
3. Verify email arrives within seconds (not minutes)
4. Check spam folder if needed

## Monitoring

After configuring custom SMTP, monitor:
- **Supabase Dashboard → Logs → Auth Logs** - Check for email errors
- **Email delivery rates** - Should be near 100%
- **Response times** - Should be < 5 seconds

## Next Steps

1. ✅ Configure custom SMTP (see `SUPABASE_SMTP_SETUP.md`)
2. ✅ Test signup flow
3. ✅ Verify emails arrive quickly
4. ✅ Check FROM address is your domain

