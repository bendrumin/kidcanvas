/**
 * Analytics Service
 * Lightweight, provider-agnostic event tracking for user behavior analysis
 */

export type AnalyticsEventName =
  // Upload flow events
  | 'upload_started'
  | 'upload_story_milestone'
  | 'upload_validation_blocked'
  | 'upload_completed'
  | 'upload_abandoned'
  // Voice recording events
  | 'voice_recording_started'
  | 'voice_recording_completed'
  | 'voice_recording_deleted'
  | 'voice_recording_played'
  // Multi-file events
  | 'multi_file_navigation'
  | 'file_removed_from_batch'
  // Engagement events
  | 'gallery_viewed'
  | 'artwork_detail_viewed'
  | 'share_link_created'
  | 'favorite_toggled'
  // Template and prompt usage
  | 'story_template_opened'
  | 'story_template_used'
  | 'moment_photo_added'
  | 'moment_photo_removed'

export interface AnalyticsEventProperties {
  // User context
  userId?: string
  familyId?: string
  subscriptionTier?: string
  daysSinceSignup?: number

  // Upload flow properties
  fileCount?: number
  currentFileIndex?: number
  storyLength?: number
  storyMilestone?: number
  hasVoice?: boolean
  hasMomentPhoto?: boolean
  hasTitle?: boolean
  hasTags?: boolean
  validationError?: string
  uploadDurationMs?: number

  // Voice recording properties
  voiceDurationSeconds?: number
  recordingAttempt?: number

  // Engagement properties
  artworkId?: string
  artworkAge?: string
  shareCode?: string
  isFavorite?: boolean

  // Session context
  sessionId?: string
  timestamp?: string
  platform?: 'web' | 'ios' | 'android'
  frameworkVersion?: 'react' | 'vanilla-js'
  reactVersion?: string
  appVersion?: string

  // Additional custom properties
  [key: string]: string | number | boolean | undefined
}

interface AnalyticsConfig {
  enabled: boolean
  debug: boolean
  provider?: 'posthog' | 'mixpanel' | 'ga4' | 'console'
}

class AnalyticsService {
  private config: AnalyticsConfig
  private sessionId: string

  constructor() {
    this.config = {
      enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
      debug: process.env.NODE_ENV === 'development',
      provider: (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER as AnalyticsConfig['provider']) || 'console'
    }
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Track an analytics event
   */
  track(eventName: AnalyticsEventName, properties?: AnalyticsEventProperties): void {
    if (!this.config.enabled && !this.config.debug) {
      return
    }

    const enrichedProperties = {
      ...properties,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      platform: this.detectPlatform(),
      ...this.detectFrameworkVersion(),
      appVersion: '1.0.0', // From package.json
    }

    if (this.config.debug) {
      console.log('[Analytics]', eventName, enrichedProperties)
    }

    // Fire and forget - don't block user actions
    this.sendEvent(eventName, enrichedProperties).catch(error => {
      if (this.config.debug) {
        console.error('[Analytics] Failed to send event:', error)
      }
    })
  }

  private async sendEvent(
    eventName: AnalyticsEventName,
    properties: AnalyticsEventProperties
  ): Promise<void> {
    try {
      // Provider-specific implementation
      switch (this.config.provider) {
        case 'posthog':
          await this.sendToPostHog(eventName, properties)
          break
        case 'mixpanel':
          await this.sendToMixpanel(eventName, properties)
          break
        case 'ga4':
          await this.sendToGA4(eventName, properties)
          break
        case 'console':
        default:
          // Default: log to console (dev mode or fallback)
          if (typeof window === 'undefined') {
            // Server-side: could log to file or DB here
            console.log(`[Analytics Server] ${eventName}`, properties)
          }
          break
      }
    } catch (error) {
      // Silently fail - analytics should never break user experience
      if (this.config.debug) {
        console.error('[Analytics] Error in sendEvent:', error)
      }
    }
  }

  private async sendToPostHog(
    eventName: string,
    properties: AnalyticsEventProperties
  ): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(eventName, properties)
    }
  }

  private async sendToMixpanel(
    eventName: string,
    properties: AnalyticsEventProperties
  ): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(eventName, properties)
    }
  }

  private async sendToGA4(
    eventName: string,
    properties: AnalyticsEventProperties
  ): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties)
    }
  }

  private detectPlatform(): 'web' | 'ios' | 'android' {
    if (typeof window === 'undefined') {
      return 'web'
    }

    const userAgent = window.navigator.userAgent.toLowerCase()
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'ios'
    }
    if (userAgent.includes('android')) {
      return 'android'
    }
    return 'web'
  }

  /**
   * Detect which framework version the user is running
   */
  private detectFrameworkVersion(): {
    frameworkVersion: 'react' | 'vanilla-js'
    reactVersion?: string
  } {
    // Server-side: always React (Next.js)
    if (typeof window === 'undefined') {
      return {
        frameworkVersion: 'react',
        reactVersion: typeof process !== 'undefined' && process.env.npm_package_dependencies?.includes('react')
          ? 'detected' // Server can't easily detect React version
          : undefined,
      }
    }

    // Client-side: check if React is loaded
    // React 18+ exposes __REACT_DEVTOOLS_GLOBAL_HOOK__ or we can check for React object
    const hasReact =
      (window as any).React ||
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
      document.querySelector('script[src*="react"]') ||
      document.querySelector('script[src*="next"]')

    if (hasReact) {
      // Try to detect React version if available
      let reactVersion: string | undefined
      try {
        // React may be available on window.React or via __REACT_DEVTOOLS_GLOBAL_HOOK__
        const reactHook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
        if (reactHook?.renderers) {
          const renderer = reactHook.renderers.get(1) // Fiber renderer
          reactVersion = renderer?.version
        } else if ((window as any).React?.version) {
          reactVersion = (window as any).React.version
        }
      } catch (e) {
        // Silently fail - version detection is optional
      }

      return {
        frameworkVersion: 'react',
        reactVersion: reactVersion || 'detected',
      }
    }

    // No React detected - vanilla JS
    return {
      frameworkVersion: 'vanilla-js',
    }
  }

  /**
   * Set user context for all subsequent events
   */
  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.config.enabled && !this.config.debug) {
      return
    }

    if (this.config.debug) {
      console.log('[Analytics] Identify:', userId, traits)
    }

    try {
      switch (this.config.provider) {
        case 'posthog':
          if (typeof window !== 'undefined' && (window as any).posthog) {
            (window as any).posthog.identify(userId, traits)
          }
          break
        case 'mixpanel':
          if (typeof window !== 'undefined' && (window as any).mixpanel) {
            (window as any).mixpanel.identify(userId)
            if (traits) {
              (window as any).mixpanel.people.set(traits)
            }
          }
          break
        case 'ga4':
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('set', { user_id: userId, ...traits })
          }
          break
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Error in identify:', error)
      }
    }
  }

  /**
   * Reset session (useful for logout)
   */
  reset(): void {
    this.sessionId = this.generateSessionId()

    if (!this.config.enabled && !this.config.debug) {
      return
    }

    try {
      switch (this.config.provider) {
        case 'posthog':
          if (typeof window !== 'undefined' && (window as any).posthog) {
            (window as any).posthog.reset()
          }
          break
        case 'mixpanel':
          if (typeof window !== 'undefined' && (window as any).mixpanel) {
            (window as any).mixpanel.reset()
          }
          break
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Error in reset:', error)
      }
    }
  }
}

// Singleton instance
export const analytics = new AnalyticsService()

// Server-side analytics helper
export function trackServerEvent(
  eventName: AnalyticsEventName,
  properties?: AnalyticsEventProperties
): void {
  if (process.env.ANALYTICS_ENABLED !== 'true' && process.env.NODE_ENV !== 'development') {
    return
  }

  // Log to console for now - can be extended to log to DB or external service
  console.log('[Analytics Server]', eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
    platform: 'server',
    frameworkVersion: 'react', // Server-side is always Next.js/React
    appVersion: '1.0.0',
  })

  // TODO: Implement server-side event logging to database or external service
  // For production, you might want to:
  // 1. Write to a dedicated analytics table
  // 2. Send to PostHog/Mixpanel server-side API
  // 3. Queue for batch processing
}
