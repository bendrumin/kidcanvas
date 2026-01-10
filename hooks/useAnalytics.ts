/**
 * React hook for analytics tracking
 * Provides easy access to analytics service with React-specific features
 */

import { useEffect, useRef, useCallback } from 'react'
import { analytics, AnalyticsEventName, AnalyticsEventProperties } from '@/lib/analytics'

interface UseAnalyticsOptions {
  // Auto-track component mount/unmount
  trackMount?: boolean
  componentName?: string
  // User context
  userId?: string
  familyId?: string
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const mountTimeRef = useRef<number | null>(null)

  // Track component mount
  useEffect(() => {
    if (options.trackMount && options.componentName) {
      mountTimeRef.current = Date.now()
      analytics.track('upload_started' as AnalyticsEventName, {
        componentName: options.componentName,
        userId: options.userId,
        familyId: options.familyId,
      })
    }

    return () => {
      if (options.trackMount && options.componentName && mountTimeRef.current) {
        const durationMs = Date.now() - mountTimeRef.current
        analytics.track('upload_abandoned' as AnalyticsEventName, {
          componentName: options.componentName,
          durationMs,
          userId: options.userId,
          familyId: options.familyId,
        })
      }
    }
  }, [options.trackMount, options.componentName, options.userId, options.familyId])

  const track = useCallback(
    (eventName: AnalyticsEventName, properties?: AnalyticsEventProperties) => {
      analytics.track(eventName, {
        ...properties,
        userId: options.userId || properties?.userId,
        familyId: options.familyId || properties?.familyId,
      })
    },
    [options.userId, options.familyId]
  )

  return { track }
}

/**
 * Hook for tracking story character count with debouncing
 */
export function useStoryTracking() {
  const lastMilestoneRef = useRef<number>(0)
  const milestones = [5, 10, 20, 50, 100, 200, 500]

  const trackStoryProgress = useCallback((
    storyLength: number,
    properties?: AnalyticsEventProperties
  ) => {
    // Find the highest milestone reached
    const currentMilestone = milestones
      .filter(m => storyLength >= m)
      .pop() || 0

    // Only track if we've reached a new milestone
    if (currentMilestone > lastMilestoneRef.current) {
      analytics.track('upload_story_milestone', {
        storyLength,
        storyMilestone: currentMilestone,
        ...properties,
      })
      lastMilestoneRef.current = currentMilestone
    }
  }, [])

  const resetTracking = useCallback(() => {
    lastMilestoneRef.current = 0
  }, [])

  return { trackStoryProgress, resetTracking }
}

/**
 * Hook for tracking voice recording lifecycle
 */
export function useVoiceTracking() {
  const recordingStartTimeRef = useRef<number | null>(null)
  const attemptCountRef = useRef<number>(0)

  const trackRecordingStart = useCallback((properties?: AnalyticsEventProperties) => {
    recordingStartTimeRef.current = Date.now()
    attemptCountRef.current += 1
    analytics.track('voice_recording_started', {
      recordingAttempt: attemptCountRef.current,
      ...properties,
    })
  }, [])

  const trackRecordingComplete = useCallback((
    durationSeconds: number,
    properties?: AnalyticsEventProperties
  ) => {
    const recordingDurationMs = recordingStartTimeRef.current
      ? Date.now() - recordingStartTimeRef.current
      : undefined

    analytics.track('voice_recording_completed', {
      voiceDurationSeconds: durationSeconds,
      recordingDurationMs,
      recordingAttempt: attemptCountRef.current,
      ...properties,
    })

    recordingStartTimeRef.current = null
  }, [])

  const trackRecordingDeleted = useCallback((
    durationSeconds?: number,
    properties?: AnalyticsEventProperties
  ) => {
    analytics.track('voice_recording_deleted', {
      voiceDurationSeconds: durationSeconds,
      recordingAttempt: attemptCountRef.current,
      ...properties,
    })
  }, [])

  const trackRecordingPlayed = useCallback((
    durationSeconds: number,
    properties?: AnalyticsEventProperties
  ) => {
    analytics.track('voice_recording_played', {
      voiceDurationSeconds: durationSeconds,
      ...properties,
    })
  }, [])

  const resetTracking = useCallback(() => {
    recordingStartTimeRef.current = null
    attemptCountRef.current = 0
  }, [])

  return {
    trackRecordingStart,
    trackRecordingComplete,
    trackRecordingDeleted,
    trackRecordingPlayed,
    resetTracking,
  }
}

/**
 * Hook for tracking multi-file upload behavior
 */
export function useMultiFileTracking(totalFiles: number) {
  const navigationCountRef = useRef<number>(0)
  const fileTimingsRef = useRef<Map<number, number>>(new Map())

  const trackFileNavigation = useCallback((
    currentIndex: number,
    properties?: AnalyticsEventProperties
  ) => {
    navigationCountRef.current += 1

    // Record when we started working on this file
    if (!fileTimingsRef.current.has(currentIndex)) {
      fileTimingsRef.current.set(currentIndex, Date.now())
    }

    analytics.track('multi_file_navigation', {
      fileCount: totalFiles,
      currentFileIndex: currentIndex,
      navigationCount: navigationCountRef.current,
      ...properties,
    })
  }, [totalFiles])

  const trackFileRemoved = useCallback((
    removedIndex: number,
    remainingCount: number,
    properties?: AnalyticsEventProperties
  ) => {
    const timeSpentMs = fileTimingsRef.current.has(removedIndex)
      ? Date.now() - fileTimingsRef.current.get(removedIndex)!
      : undefined

    analytics.track('file_removed_from_batch', {
      fileCount: totalFiles,
      removedIndex,
      remainingCount,
      timeSpentMs,
      ...properties,
    })

    fileTimingsRef.current.delete(removedIndex)
  }, [totalFiles])

  const getFileTimeSpent = useCallback((index: number): number | undefined => {
    const startTime = fileTimingsRef.current.get(index)
    return startTime ? Date.now() - startTime : undefined
  }, [])

  const resetTracking = useCallback(() => {
    navigationCountRef.current = 0
    fileTimingsRef.current.clear()
  }, [])

  return {
    trackFileNavigation,
    trackFileRemoved,
    getFileTimeSpent,
    resetTracking,
  }
}
