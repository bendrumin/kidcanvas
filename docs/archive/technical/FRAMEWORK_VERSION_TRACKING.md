# Framework Version Tracking Guide

## Overview

Your analytics system now automatically tracks which version of the app users are running (React vs vanilla JS) on every event. This data is included in all analytics events and can be viewed in Google Analytics.

## What Gets Tracked

Every analytics event now automatically includes:

- **`frameworkVersion`**: `"react"` or `"vanilla-js"` 
- **`reactVersion`**: React version string (if detected) or `"detected"`
- **`appVersion`**: Current app version (`"1.0.0"`)
- **`platform`**: `"web"` | `"ios"` | `"android"`

## Viewing in Google Analytics

### Method 1: Events Report (Easiest)

1. Go to **Google Analytics** → **Reports** → **Events**
2. Select any event (e.g., `gallery_viewed`, `upload_started`)
3. Click on the event name to see details
4. In the **Event parameters** section, look for:
   - `frameworkVersion`
   - `reactVersion`
   - `appVersion`

### Method 2: Custom Report (Most Detailed)

1. Go to **Explore** → **Blank**
2. Add dimensions:
   - **Event name**
   - **Event parameter** → `frameworkVersion` (custom parameter)
   - **Event parameter** → `platform`
3. Add metrics:
   - **Event count**
   - **Users** (if you want unique users)
4. You'll see a breakdown like:
   ```
   frameworkVersion | platform | Event count | Users
   react           | web      | 450         | 65
   react           | ios      | 23          | 2
   vanilla-js      | web      | 5           | 1
   ```

### Method 3: Real-time Analytics (Live Data)

1. Go to **Reports** → **Realtime**
2. Click on any active event
3. View the event parameters to see current `frameworkVersion` values

### Method 4: BigQuery Export (If Configured)

If you have BigQuery linked to GA4, you can run SQL queries:

```sql
SELECT 
  event_params.key,
  event_params.value.string_value as framework_version,
  COUNT(*) as event_count
FROM 
  `your-project.analytics_123456789.events_*`,
  UNNEST(event_params) as event_params
WHERE 
  event_params.key = 'frameworkVersion'
  AND _TABLE_SUFFIX BETWEEN '20240101' AND '20241231'
GROUP BY 
  event_params.key,
  event_params.value.string_value
ORDER BY 
  event_count DESC
```

## Interpreting the Data

### For Your 67 Users

Since you have 67 users, you should see:

- **Most users**: Likely showing `frameworkVersion: "react"` (since you're using Next.js/React)
- **If you see `"vanilla-js"`**: These would be users accessing a vanilla JS version (if you have one)

### Expected Distribution

For a Next.js React app:
- **99%+**: `frameworkVersion: "react"`
- **<1%**: `frameworkVersion: "vanilla-js"` (only if you have a separate vanilla JS build/entry point)

## Quick Stats Query

To quickly see your framework version breakdown, check any recent event in GA4:

1. **Reports** → **Engagement** → **Events**
2. Click any event name
3. In the event details, scroll to **Event parameters**
4. Look for `frameworkVersion` parameter

Or create a quick custom dimension in GA4:

1. **Admin** → **Custom definitions** → **Custom dimensions**
2. Create dimension: Name = "Framework Version", Scope = "Event", Event parameter = `frameworkVersion`
3. Now you can use it in all reports!

## Notes

- **Automatic**: Framework version is automatically added to ALL events going forward
- **No code changes needed**: Already implemented and working
- **Historic data**: Events tracked before this change won't have `frameworkVersion`, but all new events will
- **Debugging**: In development mode, you'll see `frameworkVersion` in console logs when events fire

## Admin Dashboard

Your admin panel at `/dashboard/admin` (for `bsiegel13@gmail.com`) shows:
- All users
- User details (email, family, role, sign-in dates)
- User management tools

You can view user analytics there, but for framework version breakdown, Google Analytics is the best source since it aggregates event-level data.
