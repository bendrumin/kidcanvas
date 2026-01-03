# Add Resend API Key to Vercel (Optional)

If you want to use Resend API for invite emails (instead of SMTP), add this to Vercel:

## Quick Add

```bash
vercel env add RESEND_API_KEY production
```

When prompted:
1. Enter your Resend API key (starts with `re_`)
2. Mark as sensitive: `y`

## Optional: Set FROM Email

```bash
vercel env add RESEND_FROM_EMAIL production
```

When prompted, enter: `support@kidcanvas.app` (or `invites@kidcanvas.app`)

## Current Setup

**Right now:**
- ✅ Supabase emails (signups) → Use Resend SMTP (configured in Supabase dashboard)
- ✅ Invite emails → Use SMTP (Porkbun, configured in Vercel)

**If you add RESEND_API_KEY:**
- ✅ Supabase emails → Resend SMTP (Supabase dashboard)
- ✅ Invite emails → Resend API (faster, more reliable)

## Benefits of Using Resend API for Invites

- ✅ Faster delivery
- ✅ Better error messages
- ✅ More reliable than SMTP
- ✅ Same service as Supabase emails (consistent)

## You Can Keep SMTP Too

If your SMTP (Porkbun) is working fine for invite emails, you don't need to add RESEND_API_KEY. The code will continue using SMTP if RESEND_API_KEY isn't set.

## Summary

**Required for Supabase emails:** Nothing in Vercel (configured in Supabase dashboard)

**Optional for invite emails:** Add `RESEND_API_KEY` to Vercel if you want to use Resend API instead of SMTP

