# OAuth Setup Guide for Google Sign-In

This guide will help you configure Google OAuth provider in Supabase for KidCanvas.

## Prerequisites

- Supabase project set up
- Vercel deployment with your domain (kidcanvas.app)
- Access to Google Cloud Console (for Google OAuth)

---

## 1. Configure Google OAuth

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen if prompted:
   - User Type: **External** (unless you have a Google Workspace)
   - App name: **KidCanvas**
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: `email`, `profile`, `openid`
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **KidCanvas Web**
   - Authorized JavaScript origins:
     - `https://kidcanvas.app`
     - `https://your-project.supabase.co` (your Supabase project URL)
   - Authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `https://kidcanvas.app/auth/callback`
7. Copy the **Client ID** and **Client Secret**

### Step 2: Configure in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** and click to configure
5. Enable the provider
6. Enter your **Client ID** and **Client Secret** from Google Cloud Console
7. Click **Save**

### Step 3: Update Redirect URLs in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your KidCanvas project
3. Go to **Settings** > **Environment Variables**
4. Ensure these are set:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key

---

## 2. Test OAuth Flow

1. Go to `https://kidcanvas.app/login`
2. Click **Continue with Google**
3. You should be redirected to Google's sign-in page
4. After signing in, you should be redirected back to your app
5. Check that a family was created automatically

---

## 3. Troubleshooting

### Google OAuth Issues

- **"redirect_uri_mismatch"**: Make sure all redirect URIs are added in Google Cloud Console
- **"invalid_client"**: Verify Client ID and Secret are correct in Supabase
- **"access_denied"**: Check OAuth consent screen is configured and published

### General Issues

- **Callback not working**: Verify `NEXT_PUBLIC_SUPABASE_URL` is set correctly in Vercel
- **Family not created**: Check Supabase logs for errors in the `create_family_for_user` function
- **User metadata missing**: The callback route should handle OAuth metadata automatically

---

## 4. Production Checklist

- [ ] Google OAuth credentials created and configured
- [ ] Google provider enabled in Supabase
- [ ] Redirect URLs configured correctly in Google Cloud Console
- [ ] Tested Google sign-in flow
- [ ] Verified family creation works for OAuth users
- [ ] Environment variables set in Vercel (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

---

## Additional Notes

- **Google OAuth** works immediately after configuration
- OAuth users will automatically have a family created on first sign-in
- User names from Google are automatically extracted and used for family creation
- The callback route handles OAuth metadata and family creation automatically

---

## Support

If you encounter issues:
1. Check Supabase logs: Dashboard > Logs > Auth
2. Check browser console for errors
3. Verify all URLs match exactly (no trailing slashes, correct protocol)
4. Ensure your domain is verified in Google Cloud Console
5. Verify OAuth consent screen is published (not just in testing mode)

