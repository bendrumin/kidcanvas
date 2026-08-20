# Feature Paywall Summary

## Current Paywall Structure

### Free Plan
- ✅ Up to 100 artworks
- ✅ 1 family
- ✅ Up to 3 children profiles
- ✅ Basic gallery view
- ✅ Public sharing links
- ✅ **Timeline** (FREE - just a different view)
- ✅ **QR Codes** (FREE - just a different sharing method)
- ❌ AI auto-tagging
- ❌ Collections & albums
- ❌ Print-ready art books (PDF)
- ❌ Advanced analytics

### Family Plan ($4.99/mo)
- ✅ Unlimited artworks
- ✅ 1 family
- ✅ Unlimited children
- ✅ **AI auto-tagging**
- ✅ **Collections & albums**
- ✅ **Print-ready art books (PDF)** ⭐ NEW
- ✅ **QR code sharing** ⭐ NEW
- ✅ **Timeline** ⭐ NEW
- ✅ Priority support
- ✅ No watermarks

### Pro Plan ($9.99/mo)
- ✅ Everything in Family
- ✅ Multiple families
- ✅ Bulk upload
- ✅ **Advanced analytics & insights** ⭐ NEW (charts, detailed stats)
- ✅ **Art growth timeline** (enhanced features)
- ✅ API access
- ✅ White-label sharing
- ✅ Dedicated support

## Feature Access Summary

| Feature | Free | Family | Pro | Notes |
|---------|------|--------|-----|-------|
| Basic Gallery | ✅ | ✅ | ✅ | All plans |
| Timeline | ✅ | ✅ | ✅ | Free - basic view |
| QR Codes | ✅ | ✅ | ✅ | Free - basic sharing |
| Collections | ❌ | ✅ | ✅ | Family+ |
| AI Tagging | ❌ | ✅ | ✅ | Family+ |
| Art Books (PDF) | ❌ | ✅ | ✅ | Family+ - premium export |
| Analytics (Basic) | ❌ | ❌ | ✅ | Pro only - detailed insights |
| Multiple Families | ❌ | ❌ | ✅ | Pro only |

## Menu Items & Access

All menu items are visible to all users, but show upgrade prompts when:
- **Collections**: Upgrade prompt for free users
- **Analytics**: Upgrade prompt for free/family users (Pro only)
- **Art Books**: Button shows "Upgrade" for free users, works for Family+

## Implementation Details

### Paywall Checks
- Collections: `/dashboard/collections` - checks `planId === 'family' || 'pro'`
- Analytics: `/dashboard/analytics` - checks `planId === 'pro'`
- Art Books: Gallery selection mode - checks `planId === 'family' || 'pro'`
- QR Codes: Always available (just different sharing method)

### Upgrade Prompts
- Reusable `UpgradePrompt` component
- Consistent design across all gated features
- Direct link to billing page

