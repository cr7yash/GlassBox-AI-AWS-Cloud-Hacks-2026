"use client"

import { useEffect, useRef, useState, useCallback, type MutableRefObject } from "react"
import { Volume2, VolumeX } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Postmortem, CriticalAlert } from "@/lib/types"

/** Pause, clear handlers/src, and null out an Audio element. */
function disposeAudio(ref: MutableRefObject<HTMLAudioElement | null>) {
  const audio = ref.current
  if (!audio) return
  audio.pause()
  audio.onended = null
  audio.removeAttribute("src")
  ref.current = null
}

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

  // Dispose audio when modal closes
  useEffect(() => {
    if (!open) {
      disposeAudio(audioRef)
      setIsPlaying(false)
    }
  }, [open])

  // Cleanup on unmount
  useEffect(() => {
    return () => disposeAudio(audioRef)
  }, [])

  const toggleAudio = useCallback(() => {
    if (!matchingAlert?.audio_url) return
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      return
    }
    try {
      // Dispose previous audio if switching to a different URL
      if (audioRef.current && audioRef.current.src !== matchingAlert.audio_url) {
        disposeAudio(audioRef)
      }
      if (!audioRef.current) {
        const audio = new Audio(matchingAlert.audio_url)
        audio.onended = () => setIsPlaying(false)
        audioRef.current = audio
      }
      // Capture instance to guard against close/dispose racing the promise
      const current = audioRef.current
      current.currentTime = 0
      current.play().then(() => {
        if (audioRef.current === current) {
          setIsPlaying(true)
        }
      }).catch(() => {})
    } catch {
      // ignore
    }
  }, [matchingAlert, isPlaying])

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
          {latest ? (
            <>
              <div className="rounded-lg border border-border bg-background/50 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {latest.markdown}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                Trace: {latest.trace_id}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 h-5 w-5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
              <p className="text-sm text-muted-foreground">Generating post-incident report…</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
