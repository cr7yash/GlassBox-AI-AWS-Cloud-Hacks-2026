"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Volume2, X } from "lucide-react"
import type { CriticalAlert } from "@/lib/types"

type CriticalAlertToastProps = {
  alerts: CriticalAlert[]
}

export function CriticalAlertToast({ alerts }: CriticalAlertToastProps) {
  const [visible, setVisible] = useState<CriticalAlert | null>(null)
  const seenRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (alerts.length > seenRef.current) {
      const latest = alerts[alerts.length - 1]
      seenRef.current = alerts.length
      setVisible(latest)

      // Play Polly audio if URL is available
      if (latest.audio_url) {
        try {
          audioRef.current = new Audio(latest.audio_url)
          audioRef.current.play().catch(() => {
            // Browser may block autoplay — that's fine
          })
        } catch {
          // Audio creation failed — ignore
        }
      }

      // Auto-dismiss after 10s
      const timer = setTimeout(() => setVisible(null), 10000)
      return () => clearTimeout(timer)
    }
  }, [alerts.length])

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
            {visible.audio_url && (
              <Volume2 className="h-3 w-3 text-red-400/60 animate-pulse" />
            )}
          </div>
          <p className="mt-1 text-sm text-red-200/90 line-clamp-3">{visible.summary}</p>
          <p className="mt-1 text-[10px] text-red-400/50 font-mono">{visible.trace_id}</p>
        </div>

        <button
          onClick={() => {
            setVisible(null)
            audioRef.current?.pause()
          }}
          className="shrink-0 text-red-400/60 hover:text-red-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
