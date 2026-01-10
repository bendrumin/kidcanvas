'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Pause, Volume2, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import WaveSurfer from 'wavesurfer.js'

interface VoicePlayerProps {
  voiceUrl: string
  duration?: number
  className?: string
}

export function VoicePlayer({
  voiceUrl,
  duration,
  className
}: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration || 0)

  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)

  useEffect(() => {
    if (!waveformRef.current) return

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#e9d5ff',
      progressColor: '#9333ea',
      cursorColor: '#9333ea',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 1,
      height: 60,
      barGap: 2,
      normalize: true,
    })

    wavesurferRef.current = wavesurfer

    // Load audio
    wavesurfer.load(voiceUrl)

    // Event listeners
    wavesurfer.on('ready', () => {
      setIsLoading(false)
      setTotalDuration(Math.floor(wavesurfer.getDuration()))
    })

    wavesurfer.on('play', () => setIsPlaying(true))
    wavesurfer.on('pause', () => setIsPlaying(false))
    wavesurfer.on('finish', () => setIsPlaying(false))

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(Math.floor(wavesurfer.getCurrentTime()))
    })

    wavesurfer.on('error', (error) => {
      console.error('WaveSurfer error:', error)
      setIsLoading(false)
    })

    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
      }
    }
  }, [voiceUrl])

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause()
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = voiceUrl
    link.download = `voice-story-${Date.now()}.webm`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-purple-600" aria-hidden="true" />
            <h3 className="font-semibold">Voice Story</h3>
          </div>
          <Button
            onClick={handleDownload}
            variant="ghost"
            size="sm"
            aria-label="Download voice note"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Waveform */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" aria-hidden="true" />
            </div>
          )}
          <div ref={waveformRef} className="w-full" />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button
            onClick={togglePlayPause}
            disabled={isLoading}
            size="sm"
            variant="default"
            className="shrink-0"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" aria-hidden="true" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                Play
              </>
            )}
          </Button>

          <div className="flex-1 text-sm font-mono text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </div>
        </div>
      </div>
    </Card>
  )
}
