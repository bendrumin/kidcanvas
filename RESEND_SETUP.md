# Setting Up Resend for Supabase Emails

Resend is much easier and more reliable than configuring custom SMTP. Here's how to set it up:

## Why Resend is Better

✅ **Designed for transactional emails** - Built specifically for apps like yours  
✅ **Better deliverability** - Higher inbox rates than generic SMTP  
✅ **Easier setup** - Simple API key, no complex SMTP config  
✅ **Better documentation** - Clear guides and examples  
✅ **Free tier** - 3,000 emails/month free  
✅ **Domain verification** - Easy to verify your domain  

## Setup Steps

### 1. Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Verify Your Domain

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter: `kidcanvas.app`
4. Resend will provide DNS records to add:
   - **SPF record**
   - **DKIM records** (usually 3)
   - **DMARC record** (optional but recommended)

5. Add these records to your Porkbun DNS:
   - Go to Porkbun → Your Domain → DNS Records
   - Add each record Resend provides
   - Wait for verification (usually 5-10 minutes)

6. Once verified, you can send from `support@kidcanvas.app` or any address on your domain

### 3. Get SMTP Settings from Resend

1. In Resend dashboard, go to **Settings** → **SMTP**
2. You'll see SMTP credentials:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587 (or 465)
   SMTP Username: resend
   SMTP Password: [your Resend API key - starts with re_]
   ```

### 4. Configure in Supabase

1. Go to Supabase Dashboard → Settings → Auth → SMTP Settings
2. Enable **Custom SMTP**
3. Enter Resend's SMTP settings:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Password: re_xxxxxxxxxxxxx (your Resend API key)
   SMTP Admin Email: support@kidcanvas.app (or noreply@kidcanvas.app)
   ```
4. Click **Save**

### 5. Test

1. Try signing up a new user
2. Check that confirmation email arrives quickly
3. Verify FROM address shows your domain

## Alternative: Use Resend API Directly (Advanced)

If you want even more control, you could bypass Supabase's email system entirely and use Resend's API. However, this requires:
- Custom code to send confirmation emails
- Managing email templates yourself
- More complex implementation

**For now, using Resend's SMTP in Supabase is the easiest approach.**

## Benefits Over Porkbun SMTP

- ✅ **No authentication issues** - Resend's SMTP is designed for this
- ✅ **Better deliverability** - Optimized for transactional emails
- ✅ **Easier troubleshooting** - Better error messages
- ✅ **Free tier** - 3,000 emails/month (plenty for testing)
- ✅ **Scales easily** - Pay as you grow

## Pricing

- **Free:** 3,000 emails/month
- **Pro:** $20/month for 50,000 emails
- **Pay as you go:** $0.30 per 1,000 emails after free tier

For a family app, the free tier should be plenty to start!

## Next Steps

1. Sign up for Resend
2. Verify your domain (kidcanvas.app)
3. Get SMTP credentials
4. Configure in Supabase
5. Test signup flow

This should resolve all the SMTP authentication issues you've been having!

