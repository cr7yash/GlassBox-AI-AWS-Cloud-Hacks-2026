"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Trace } from "@/lib/types"

const SIMULATOR_URL =
  process.env.NEXT_PUBLIC_SIMULATOR_URL ?? "http://localhost:8080"

const POLL_INTERVAL = 2000 // 2 seconds

interface TracePolling {
  traces: Trace[]
  error: string | null
}

/**
 * Polls GET /traces/{sessionId}?after=N every 2s.
 * Used as a fallback when the WebSocket (Role 3) isn't deployed yet.
 */
export function useTracePolling(sessionId: string | null): TracePolling {
  const [traces, setTraces] = useState<Trace[]>([])
  const [error, setError] = useState<string | null>(null)
  const afterRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(
        `${SIMULATOR_URL}/traces/${sessionId}?after=${afterRef.current}`,
      )
      if (!res.ok) return
      const data = await res.json()
      const newTraces: Trace[] = data.traces ?? []
      if (newTraces.length > 0) {
        afterRef.current = data.total
        setTraces((prev) => [...prev, ...newTraces])
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Polling failed")
    }
  }, [sessionId])

  useEffect(() => {
    // Reset on session change
    setTraces([])
    setError(null)
    afterRef.current = 0

    if (!sessionId) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    // Start polling
    poll() // immediate first poll
    intervalRef.current = setInterval(poll, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [sessionId, poll])

  return { traces, error }
}
