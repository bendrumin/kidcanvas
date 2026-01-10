'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, Square, Play, Pause, Trash2, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  onRecordingRemove?: () => void
  existingAudioUrl?: string
  disabled?: boolean
  maxDuration?: number // in seconds
}

export function VoiceRecorder({
  onRecordingComplete,
  onRecordingRemove,
  existingAudioUrl,
  disabled = false,
  maxDuration = 180 // 3 minutes default
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioUrl && !existingAudioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl, existingAudioUrl])

  // Update audio URL when existing URL changes
  useEffect(() => {
    if (existingAudioUrl) {
      setAudioUrl(existingAudioUrl)
    }
  }, [existingAudioUrl])

  const startRecording = async () => {
    try {
      setError(null)

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })

      streamRef.current = stream

      // Create MediaRecorder with appropriate MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }

        // Call callback with audio blob and duration
        onRecordingComplete(audioBlob, recordingTime)
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1
          // Auto-stop at max duration
          if (newTime >= maxDuration) {
            stopRecording()
            return maxDuration
          }
          return newTime
        })
      }, 1000)
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Unable to access microphone. Please check permissions.')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)

      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1
          if (newTime >= maxDuration) {
            stopRecording()
            return maxDuration
          }
          return newTime
        })
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const removeRecording = () => {
    if (audioUrl && !existingAudioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setRecordingTime(0)
    setPlaybackTime(0)
    setIsPlaying(false)
    audioChunksRef.current = []

    if (onRecordingRemove) {
      onRecordingRemove()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-purple-600" aria-hidden="true" />
            <h3 className="font-semibold">Voice Story</h3>
            {!isRecording && !audioUrl && (
              <span className="text-sm text-muted-foreground">(Optional)</span>
            )}
          </div>
          {recordingTime > 0 && (
            <div className="text-sm font-mono text-muted-foreground">
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* Recording controls */}
        {!audioUrl && (
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <Button
                type="button"
                onClick={startRecording}
                disabled={disabled}
                className="flex-1"
                variant="outline"
              >
                <Mic className="h-4 w-4 mr-2" aria-hidden="true" />
                Start Recording
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button
                    type="button"
                    onClick={pauseRecording}
                    variant="outline"
                    className="flex-1"
                  >
                    <Pause className="h-4 w-4 mr-2" aria-hidden="true" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={resumeRecording}
                    variant="outline"
                    className="flex-1"
                  >
                    <Mic className="h-4 w-4 mr-2" aria-hidden="true" />
                    Resume
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={stopRecording}
                  variant="default"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" aria-hidden="true" />
                  Stop
                </Button>
              </>
            )}
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <div className={cn(
              "w-2 h-2 rounded-full bg-red-600",
              !isPaused && "animate-pulse"
            )} />
            {isPaused ? 'Recording paused' : 'Recording...'}
          </div>
        )}

        {/* Playback controls */}
        {audioUrl && (
          <div className="space-y-3">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setPlaybackTime(Math.floor(e.currentTarget.currentTime))}
              onLoadedMetadata={(e) => {
                if (!recordingTime) {
                  setRecordingTime(Math.floor(e.currentTarget.duration))
                }
              }}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              {!isPlaying ? (
                <Button
                  type="button"
                  onClick={playAudio}
                  variant="outline"
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                  Play
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={pauseAudio}
                  variant="outline"
                  size="sm"
                >
                  <Pause className="h-4 w-4 mr-2" aria-hidden="true" />
                  Pause
                </Button>
              )}

              <div className="flex-1 text-sm text-muted-foreground font-mono">
                {formatTime(playbackTime)} / {formatTime(recordingTime)}
              </div>

              <Button
                type="button"
                onClick={removeRecording}
                variant="ghost"
                size="sm"
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {/* Visual indicator */}
            <div className="flex items-center gap-1 h-8">
              {audioUrl && (
                <div className="flex-1 bg-purple-100 rounded-full h-2 relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-purple-600 rounded-full transition-all"
                    style={{
                      width: recordingTime > 0 ? `${(playbackTime / recordingTime) * 100}%` : '0%'
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" aria-hidden="true" />
              Voice story recorded ({formatTime(recordingTime)})
            </div>
          </div>
        )}

        {/* Help text */}
        {!isRecording && !audioUrl && (
          <p className="text-sm text-muted-foreground">
            Record your child telling the story of their artwork, or capture your own thoughts about what they created. Voice stories make memories even more special!
          </p>
        )}
      </div>
    </Card>
  )
}
