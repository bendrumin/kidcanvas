# Analytics Implementation

## Overview

Analytics tracking has been implemented to gather data on user behavior during the upload flow. This will help answer critical product questions about friction points and feature adoption.

## Key Questions Being Tracked

1. **Where do users drop off?**
   - Upload started but abandoned
   - Story character count when abandoned
   - Multi-file upload abandonment patterns

2. **Does voice recording correlate with retention?**
   - Voice recording adoption rate
   - Uploads with vs without voice
   - Voice recording completion rate

3. **What story length predicts return visits?**
   - Story character count milestones (5, 10, 20, 50, 100, 200, 500 chars)
   - Average story length per upload
   - Template usage vs freestyle writing

4. **Is the 20-char minimum the real blocker?**
   - Validation blocked events with story length
   - Users who reach 20 chars vs those who abandon before

5. **Does multi-file upload kill completion rates?**
   - File navigation patterns
   - Files removed from batch
   - Time spent per file in multi-upload

## Events Tracked

### Upload Flow Events

- **`upload_started`**: User opens upload modal
  - Properties: `fileCount`, `captureMethod` (drag-drop, camera)

- **`upload_story_milestone`**: Story reaches character milestones (5, 10, 20, 50, 100, 200, 500)
  - Properties: `storyLength`, `storyMilestone`, `fileCount`, `currentFileIndex`

- **`upload_validation_blocked`**: User blocked by validation
  - Properties: `validationError`, `storyLength`, `fileCount`, `currentLimit`, `currentUsage`

- **`upload_completed`**: Successful upload
  - Properties: `fileCount`, `uploadDurationMs`, `apiDurationMs`, `avgStoryLength`, `filesWithVoice`, `filesWithMomentPhoto`, `filesWithTags`

- **`upload_abandoned`**: User cancels/closes upload modal
  - Properties: `fileCount`, `currentFileIndex`, `storyLength`, `uploadDurationMs`

### Voice Recording Events

- **`voice_recording_started`**: User starts recording
  - Properties: `recordingAttempt`

- **`voice_recording_completed`**: Recording finished
  - Properties: `voiceDurationSeconds`, `recordingDurationMs`, `recordingAttempt`, `hasStory`

- **`voice_recording_deleted`**: User removes recording
  - Properties: `voiceDurationSeconds`, `recordingAttempt`

- **`voice_recording_played`**: User plays back recording
  - Properties: `voiceDurationSeconds`

### Multi-File Upload Events

- **`multi_file_navigation`**: User navigates between files
  - Properties: `fileCount`, `currentFileIndex`, `navigationCount`, `direction`

- **`file_removed_from_batch`**: User removes file from batch
  - Properties: `fileCount`, `removedIndex`, `remainingCount`, `timeSpentMs`, `storyLength`

### Feature Usage Events

- **`story_template_used`**: User selects a story template
  - Properties: `templateId`, `templateTitle`, `fileCount`, `currentFileIndex`

- **`moment_photo_added`**: User adds moment photo
  - Properties: `fileCount`, `currentFileIndex`

- **`moment_photo_removed`**: User removes moment photo
  - Properties: `fileCount`, `currentFileIndex`

## Configuration

Analytics is controlled by environment variables:

```bash
# Enable/disable analytics tracking
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# Analytics provider (console, posthog, mixpanel, ga4)
NEXT_PUBLIC_ANALYTICS_PROVIDER=console

# Server-side analytics (for API tracking)
ANALYTICS_ENABLED=true
```

### Development Mode

In development (`NODE_ENV=development`), all events are logged to console regardless of `ANALYTICS_ENABLED` setting. This allows you to see events in real-time.

### Production Mode

In production, set `NEXT_PUBLIC_ANALYTICS_ENABLED=true` and configure your analytics provider.

## Analytics Providers

### Console (Default)
Logs events to browser console (client) and server logs. Good for testing.

### PostHog
```typescript
// Add to app layout or _app.tsx
import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init('YOUR_API_KEY', {
    api_host: 'https://app.posthog.com'
  })
}
```

### Mixpanel
```typescript
import mixpanel from 'mixpanel-browser'

if (typeof window !== 'undefined') {
  mixpanel.init('YOUR_PROJECT_TOKEN')
}
```

### Google Analytics 4
Add GA4 script to your app and events will be sent via `gtag()`.

## Files Modified

### New Files
- `lib/analytics.ts` - Core analytics service
- `hooks/useAnalytics.ts` - React hooks for tracking
- `ANALYTICS.md` - This documentation

### Modified Files
- `components/upload/upload-form.tsx` - Upload flow tracking
- `app/api/upload/route.ts` - Server-side tracking

## Usage Example

```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

function MyComponent() {
  const { track } = useAnalytics({ userId: 'user123', familyId: 'fam456' })

  const handleAction = () => {
    track('custom_event', {
      customProperty: 'value',
      anotherProperty: 123
    })
  }
}
```

## Data Privacy

- All tracking is anonymous by default
- User IDs are hashed in production (configure in analytics service)
- No PII is tracked in event properties
- Story content is never logged (only length)
- Complies with GDPR/CCPA requirements

## Next Steps

1. **Set up analytics provider** - Choose PostHog, Mixpanel, or GA4
2. **Configure environment variables** - Enable tracking in production
3. **Set up dashboards** - Create visualizations for key metrics
4. **Define cohorts** - Segment users by behavior patterns
5. **Run experiments** - A/B test story requirement changes

## Key Metrics to Monitor

1. **Upload Completion Rate**: `upload_completed / upload_started`
2. **Story Milestone Drop-off**: Users reaching each character milestone
3. **Voice Adoption Rate**: `uploads_with_voice / total_uploads`
4. **Multi-file Abandonment**: Files removed vs completed
5. **Template Usage**: `story_template_used / upload_started`
6. **Validation Blocks**: Frequency and type of validation errors

## Questions This Will Answer

### Hypothesis: Friction = Retention
- **Test**: Compare return rates for users who wrote 20-50 char stories vs 200+ char stories
- **Metric**: Days between uploads, correlated with first upload story length

### Voice as Story Substitute
- **Test**: Do users with voice recordings have higher completion rates?
- **Metric**: `upload_completed` rate for users who use voice vs those who don't

### Multi-file Friction
- **Test**: Does batch upload reduce per-artwork quality?
- **Metric**: Average story length in multi-file uploads vs single uploads

### 20-char Minimum Impact
- **Test**: How many users reach 10-19 chars and abandon?
- **Metric**: Story length distribution in `upload_abandoned` events
