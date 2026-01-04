# Vercel Environment Variable Setup

## Add Anthropic API Key to Vercel

### Steps:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your KidCanvas project
3. Click **Settings** (top nav)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New**
6. Fill in:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: `your-anthropic-api-key-here`
   - **Environment**: Select all (Production, Preview, Development)
7. Click **Save**
8. **Redeploy** your app (Vercel will prompt you or go to Deployments → click ... → Redeploy)

## Why This is Needed
Environment variables in `.env.local` only work locally. Vercel needs them configured separately for production.

## Verify It Works
After redeploying:
1. Upload an artwork via your live site
2. Check Supabase database
3. Look for `ai_description` and `ai_tags` fields populated

---

**DO THIS NOW before I implement the UI features!** Otherwise users won't see AI analysis in production.
