"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Volume2, VolumeX } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Postmortem, CriticalAlert } from "@/lib/types"

type PostmortemModalProps = {
  postmortems: Postmortem[]
  alerts: CriticalAlert[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PostmortemModal({ postmortems, alerts, open, onOpenChange }: PostmortemModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const latest = postmortems[postmortems.length - 1]

  // Find matching alert for audio
  const matchingAlert = latest
    ? alerts.find((a) => a.trace_id === latest.trace_id)
    : undefined

  // Clean up audio when modal closes
  useEffect(() => {
    if (!open) {
      audioRef.current?.pause()
      setIsPlaying(false)
    }
  }, [open])

  const toggleAudio = useCallback(() => {
    if (!matchingAlert?.audio_url) return
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      return
    }
    try {
      if (!audioRef.current || audioRef.current.src !== matchingAlert.audio_url) {
        audioRef.current = new Audio(matchingAlert.audio_url)
        audioRef.current.addEventListener("ended", () => setIsPlaying(false))
      }
      audioRef.current.currentTime = 0
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    } catch {
      // ignore
    }
  }, [matchingAlert, isPlaying])

  if (!latest) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-red-500/30 bg-card" aria-describedby="postmortem-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Post-Incident Report
            {matchingAlert?.audio_url && (
              <button
                onClick={toggleAudio}
                className={`ml-auto flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  isPlaying
                    ? "border-red-400/50 bg-red-500/20 text-red-200"
                    : "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                }`}
                aria-label={isPlaying ? "Stop audio narration" : "Play audio narration"}
              >
                {isPlaying ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                {isPlaying ? "Stop" : "Listen"}
              </button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="prose prose-invert prose-sm max-w-none" id="postmortem-description">
          <div className="rounded-lg border border-border bg-background/50 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {latest.markdown}
          </div>
        </div>

        <div className="mt-2 text-[10px] text-muted-foreground">
          Trace: {latest.trace_id}
        </div>
      </DialogContent>
    </Dialog>
  )
}
