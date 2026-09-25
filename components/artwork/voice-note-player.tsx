'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Mic, Pause, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { VOICE_BUCKET } from '@/lib/storage'
import { cn } from '@/lib/utils'

// Long enough to finish listening and replay a few times, short enough that a
// copied link stops working the same day.
const SIGNED_URL_SECONDS = 60 * 60

interface VoiceNotePlayerProps {
  path: string
  durationSeconds: number | null
  childName?: string | null
  /** Feed cards get a single pill; the detail page gets a labeled row. */
  compact?: boolean
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * Plays a recording from the private voice-notes bucket.
 *
 * The signed URL is minted on the first tap, not on render, so a feed of fifty
 * cards does not create fifty live links nobody listens to. The browser client
 * signs with the viewer's own session, so storage RLS decides who can hear it.
 */
export function VoiceNotePlayer({ path, durationSeconds, childName, compact = false }: VoiceNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  const handleToggle = async () => {
    if (isPlaying) {
      audioRef.current?.pause()
      return
    }

    setFailed(false)
    let url = signedUrl
    if (!url) {
      setIsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from(VOICE_BUCKET)
        .createSignedUrl(path, SIGNED_URL_SECONDS)
      setIsLoading(false)
      if (error || !data?.signedUrl) {
        setFailed(true)
        return
      }
      url = data.signedUrl
      setSignedUrl(url)
    }

    if (!audioRef.current) {
      const audio = new Audio(url)
      audio.addEventListener('play', () => setIsPlaying(true))
      audio.addEventListener('pause', () => setIsPlaying(false))
      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        setElapsed(0)
      })
      audio.addEventListener('timeupdate', () => setElapsed(audio.currentTime))
      audio.addEventListener('error', () => {
        // Usually an expired link after the tab sat open; the next tap re-signs.
        setIsPlaying(false)
        setFailed(true)
        setSignedUrl(null)
        audioRef.current = null
      })
      audioRef.current = audio
    }

    try {
      await audioRef.current.play()
    } catch {
      setFailed(true)
    }
  }

  const who = childName ? `${childName} telling it` : 'Them telling it'
  const total = durationSeconds ?? 0
  const timeLabel = isPlaying || elapsed > 0
    ? `${formatDuration(elapsed)} / ${formatDuration(total)}`
    : formatDuration(total)
  const Icon = isLoading ? Loader2 : isPlaying ? Pause : Play
  const actionLabel = isPlaying ? `Pause ${who.toLowerCase()}` : `Play ${who.toLowerCase()}`

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={actionLabel}
        className="inline-flex items-center gap-2 rounded-full border border-pink-200 dark:border-pink-900/40 bg-pink-50 dark:bg-pink-950/20 px-3 py-1.5 text-sm font-medium text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-950/40 transition-colors"
      >
        <Icon className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        <span>{failed ? "Couldn't play" : 'Listen'}</span>
        <span className="tabular-nums text-pink-600/80 dark:text-pink-300/80">{timeLabel}</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-pink-200/60 dark:border-pink-900/30 bg-white/70 dark:bg-gray-900/40 p-4">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={actionLabel}
        className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
      >
        <Icon className={cn('w-5 h-5', isLoading && 'animate-spin')} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          <Mic className="w-4 h-4 text-pink-500" />
          In their own voice
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {failed ? "Couldn't play the recording. Try again." : `${who}, ${timeLabel}`}
        </p>
      </div>
    </div>
  )
}
