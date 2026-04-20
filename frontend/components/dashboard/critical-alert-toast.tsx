"use client"

import { useEffect, useRef, useState, useCallback, type MutableRefObject } from "react"
import { AlertTriangle, Volume2, VolumeX, FileText, X } from "lucide-react"
import type { CriticalAlert } from "@/lib/types"

/** Pause, clear handlers/src, and null out an Audio element. */
function disposeAudio(ref: MutableRefObject<HTMLAudioElement | null>) {
  const audio = ref.current
  if (!audio) return
  audio.pause()
  audio.onended = null
  audio.removeAttribute("src")
  ref.current = null
}

type CriticalAlertToastProps = {
  alerts: CriticalAlert[]
  onViewReport?: () => void
}

export function CriticalAlertToast({ alerts, onViewReport }: CriticalAlertToastProps) {
  const [visible, setVisible] = useState<CriticalAlert | null>(null)
  const seenRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    // Stream reset (e.g. session change) — dismiss stale toast & reset counter
    if (alerts.length === 0) {
      disposeAudio(audioRef)
      setIsPlaying(false)
      setVisible(null)
      seenRef.current = 0
      return
    }

    // Also handle length decreasing without hitting 0 (edge case)
    if (alerts.length < seenRef.current) {
      seenRef.current = 0
    }

    if (alerts.length > seenRef.current) {
      const latest = alerts[alerts.length - 1]
      seenRef.current = alerts.length

      // Stop & fully dispose any previously loaded audio
      disposeAudio(audioRef)
      setIsPlaying(false)
      setVisible(latest)

      // Pre-load audio so it's ready when user clicks
      if (latest.audio_url) {
        try {
          const audio = new Audio(latest.audio_url)
          audio.preload = "auto"
          audio.onended = () => setIsPlaying(false)
          audioRef.current = audio
        } catch {
          // Audio creation failed — ignore
        }
      }
    }
  }, [alerts.length])

  // Cleanup on unmount
  useEffect(() => {
    return () => disposeAudio(audioRef)
  }, [])

  const toggleAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      audio.currentTime = 0
      setIsPlaying(false)
    } else {
      // Capture instance to guard against dispose racing the promise
      const current = audio
      current.play().then(() => {
        if (audioRef.current === current) {
          setIsPlaying(true)
        }
      }).catch(() => {})
    }
  }, [isPlaying])

  const dismiss = useCallback(() => {
    disposeAudio(audioRef)
    setIsPlaying(false)
    setVisible(null)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-950/90 px-4 py-3 shadow-[0_0_40px_rgba(239,68,68,0.2)] backdrop-blur-sm max-w-md">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-red-400 tracking-wide">CRITICAL ALERT</span>
          </div>
          <p className="mt-1 text-sm text-red-200/90 line-clamp-3">{visible.summary}</p>
          <p className="mt-1 text-[10px] text-red-400/50 font-mono">{visible.trace_id}</p>

          {/* Action buttons */}
          <div className="mt-2 flex items-center gap-2">
            {onViewReport && (
              <button
                onClick={() => {
                  onViewReport()
                  dismiss()
                }}
                className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200"
              >
                <FileText className="h-3 w-3" />
                View Report
              </button>
            )}
            {visible.audio_url && (
              <button
                onClick={toggleAudio}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  isPlaying
                    ? "border-red-400/50 bg-red-500/20 text-red-200"
                    : "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                }`}
                aria-label={isPlaying ? "Stop audio alert" : "Play audio alert"}
              >
                {isPlaying ? (
                  <VolumeX className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
                {isPlaying ? "Stop" : "Listen"}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={dismiss}
          className="shrink-0 text-red-400/60 hover:text-red-300 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
