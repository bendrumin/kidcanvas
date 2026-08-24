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
- **Storage:** Supabase Storage
- **AI:** Anthropic Claude (optional)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- (Storage is a Supabase bucket; no separate provider needed)
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
   - Run the SQL in `supabase/schema_baseline.sql` in the SQL Editor
     (see `supabase/README.md` -- do not run anything in `supabase/archive/`)
   - Copy your project URL and keys to `.env.local`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App -- single canonical origin. Share links and Stripe redirect URLs are
# built from this, so it must be exactly one URL.
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: extra origins that should still pass the CSRF origin check
# (comma-separated). Used so www and an old deploy host keep working when the
# canonical domain changes.
CSRF_ALLOWED_ORIGINS=

# Optional: invite emails. Without either of these the invite API returns 503
# and the UI falls back to sharing the link manually.
RESEND_API_KEY=
# ...or SMTP instead of Resend:
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Optional: gates the /dashboard/admin page and the admin delete endpoint
ADMIN_EMAIL=
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
- 3 children profiles
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

