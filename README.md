# KidCanvas 🎨

A beautiful family artwork scanner and gallery app. Scan, organize, and share your kids' artwork with the whole family.

## Features

- 📱 **Smart Scanning** - iOS app with VisionKit for automatic edge detection and glare removal
- 👨‍👩‍👧‍👦 **Family Sharing** - Invite grandparents, aunts, uncles - everyone can view and contribute
- 🤖 **AI Auto-Tagging** - Automatic descriptions and tags powered by Claude
- 🖼️ **Beautiful Gallery** - Responsive grid with lightbox, filters, and search
- ❤️ **Favorites** - Heart your favorites for easy access
- 📁 **Collections** - Organize artwork by theme or event
- 🔗 **Public Sharing** - Generate shareable links for single artworks

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth, Database, Realtime)
- **Storage:** Cloudflare R2 (S3-compatible)
- **AI:** Anthropic Claude (optional)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Cloudflare R2 bucket (or any S3-compatible storage)
- Anthropic API key (optional, for AI features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/kidcanvas.git
   cd kidcanvas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment example and fill in your values:
   ```bash
   cp .env.local.example .env.local
   ```

4. Set up your Supabase database:
   - Create a new Supabase project
   - Run the SQL in `supabase/schema.sql` in the SQL Editor
   - Copy your project URL and keys to `.env.local`

5. Set up Cloudflare R2:
   - Create an R2 bucket
   - Generate API tokens with read/write access
   - Add the endpoint and credentials to `.env.local`

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cloudflare R2
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET=kidcanvas-artwork
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Optional: Claude API for AI tagging
ANTHROPIC_API_KEY=your_anthropic_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
app/
├── (auth)/                 # Authentication pages
│   ├── login/
│   ├── signup/
│   └── invite/[code]/
├── (dashboard)/            # Protected dashboard routes
│   └── dashboard/
│       ├── page.tsx        # Gallery home
│       ├── artwork/[id]/   # Artwork detail
│       ├── children/       # Children management
│       ├── collections/    # Collections
│       ├── family/         # Family members
│       ├── favorites/      # Favorite artworks
│       ├── settings/       # Account settings
│       └── upload/         # Upload new artwork
├── (public)/
│   └── share/[code]/       # Public share pages
├── api/
│   ├── upload/             # Image upload endpoint
│   └── ai-tag/             # AI tagging endpoint
└── page.tsx                # Landing page

components/
├── artwork/                # Artwork components
├── children/               # Children management
├── dashboard/              # Dashboard layout
├── family/                 # Family management
├── gallery/                # Gallery components
├── upload/                 # Upload components
└── ui/                     # shadcn/ui components

lib/
├── supabase/              # Supabase clients
├── r2.ts                  # R2 storage utilities
└── utils.ts               # Utility functions
```

## Role Permissions

| Action | Owner | Parent | Member | Viewer |
|--------|-------|--------|--------|--------|
| View gallery | ✅ | ✅ | ✅ | ✅ |
| Add artwork | ✅ | ✅ | ✅ | ❌ |
| Delete artwork | ✅ | ✅ | ❌ | ❌ |
| Manage children | ✅ | ✅ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅* | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |

*Parents cannot remove other parents or the owner

## iOS App (Coming Soon)

The iOS app uses SwiftUI and VisionKit for:
- Document scanning with automatic edge detection
- Perspective correction
- Glare removal
- Batch scanning

## Pricing

**Free:**
- 1 family
- 2 children profiles
- 100 artworks

**Family Plan ($4.99/mo or $49.99/year):**
- Unlimited children and artworks
- AI auto-tagging
- Collections
- Public gallery links

## License

MIT License - feel free to use this for your own family!

---

Made with ❤️ for families who want to preserve every scribble.

