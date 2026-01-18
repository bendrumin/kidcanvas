'use client'

import { useEffect } from 'react'
import { analytics } from '@/lib/analytics'

/**
 * Tracks page load with framework version information
 * This component automatically sends framework version data to analytics
 * on every page load so you can see which version users are using
 */
export function PageLoadTracker() {
  useEffect(() => {
    // Track page load with framework version info
    // This ensures we capture framework version for all users
    analytics.track('gallery_viewed', {
      // This will automatically include frameworkVersion, reactVersion, appVersion
      // from the analytics service's detectFrameworkVersion() method
    })
  }, [])

  return null // This component doesn't render anything
}