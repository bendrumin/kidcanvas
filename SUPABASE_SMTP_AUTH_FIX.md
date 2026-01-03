# Fix: Supabase SMTP Authentication Error

## The Error

```
"error": "535 5.7.8 Error: authentication failed: authentication failure"
"msg": "500: Error sending confirmation email"
```

This means Supabase is trying to use your custom SMTP, but the authentication credentials are incorrect.

## Common Causes & Fixes

### 1. Wrong Password

**Check:**
- Is the password correct?
- Are there any extra spaces before/after the password?
- Did you copy-paste the password (might have hidden characters)?

**Fix:**
- Re-enter the password manually
- Make sure there are no spaces
- Try resetting your email password if unsure

### 2. Wrong Username Format

**Porkbun typically requires:**
- Full email address: `support@kidcanvas.app` ✅
- NOT just: `support` ❌

**Fix:**
- Make sure "SMTP User" is your full email address
- Double-check for typos

### 3. Wrong Port/Security Settings

**Try these combinations:**

**Option A (STARTTLS):**
```
SMTP Host: mail.porkbun.com
SMTP Port: 587
Security: STARTTLS (or "TLS")
```

**Option B (SSL/TLS):**
```
SMTP Host: mail.porkbun.com
SMTP Port: 465
Security: SSL (or "TLS")
```

**Option C (Alternative host):**
```
SMTP Host: smtp.porkbun.com
SMTP Port: 587
Security: STARTTLS
```

### 4. Need App Password

Some email providers require an "app password" instead of your regular password.

**Check Porkbun:**
- Look for "App Passwords" or "Application Passwords" in your email settings
- If available, generate one and use that instead of your regular password

### 5. Email Account Not Active

**Check:**
- Is your Porkbun email account active?
- Can you log into webmail with the same credentials?
- Is the account suspended or disabled?

### 6. Firewall/IP Restrictions

**Check:**
- Does Porkbun allow SMTP from Supabase's IPs?
- Check Porkbun email settings for IP allowlists
- You may need to whitelist Supabase's IP ranges

## Step-by-Step Fix

1. **Verify credentials work locally:**
   - Try logging into Porkbun webmail with the same email/password
   - If that doesn't work, reset your password

2. **Double-check Supabase settings:**
   - Go to Supabase Dashboard → Settings → Auth → SMTP Settings
   - Verify each field:
     - SMTP Host: `mail.porkbun.com` (or `smtp.porkbun.com`)
     - SMTP Port: `587` (try `465` if 587 doesn't work)
     - SMTP User: `support@kidcanvas.app` (full email)
     - SMTP Password: [no spaces, correct password]
     - SMTP Admin Email: `support@kidcanvas.app`

3. **Try different port:**
   - If using 587, try 465
   - If using 465, try 587
   - Make sure security setting matches (STARTTLS for 587, SSL for 465)

4. **Test with a different email client:**
   - Try configuring the same SMTP in Outlook/Thunderbird
   - If it works there, the credentials are correct
   - If it doesn't, the issue is with the credentials themselves

5. **Contact Porkbun Support:**
   - Ask for the exact SMTP settings for your account
   - Verify if app passwords are required
   - Check if there are any IP restrictions

## Quick Test

After updating settings in Supabase:
1. Wait 1-2 minutes for changes to propagate
2. Try signing up a new user
3. Check Supabase Auth Logs for new errors
4. If still failing, try the alternative port/security combination

## Alternative: Use Resend

If Porkbun SMTP continues to have issues, consider using Resend:

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Get SMTP settings from Resend dashboard
4. Use those in Supabase instead

Resend is designed for transactional emails and typically has better compatibility.

