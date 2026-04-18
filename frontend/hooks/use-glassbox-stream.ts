/**
 * WebSocket hook for live trace streaming (Contract B).
 *
 * Connects to the platform WebSocket and dispatches messages by type.
 * Falls back gracefully if the WebSocket URL is not configured.
 */

"use client"

import { useEffect, useRef, useState } from "react"
import type { Trace, CriticalAlert, Postmortem, WsMessage } from "@/lib/types"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? ""

interface GlassboxStream {
  traces: Trace[]
  alerts: CriticalAlert[]
  postmortems: Postmortem[]
  connected: boolean
  error: string | null
}

export function useGlassboxStream(sessionId: string | null): GlassboxStream {
  const [traces, setTraces] = useState<Trace[]>([])
  const [alerts, setAlerts] = useState<CriticalAlert[]>([])
  const [postmortems, setPostmortems] = useState<Postmortem[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Reset state when session changes
  useEffect(() => {
    setTraces([])
    setAlerts([])
    setPostmortems([])
    setError(null)
  }, [sessionId])

  useEffect(() => {
    if (!sessionId || !WS_URL) {
      setConnected(false)
      return
    }

    const url = `${WS_URL}?session_id=${sessionId}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setError(null)
    }

    ws.onmessage = (ev) => {
      try {
        const msg: WsMessage = JSON.parse(ev.data)
        switch (msg.type) {
          case "trace":
            setTraces((prev) => [...prev, msg.payload])
            break
          case "critical_alert":
            setAlerts((prev) => [...prev, msg.payload])
            break
          case "postmortem":
            setPostmortems((prev) => [...prev, msg.payload])
            break
        }
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onerror = () => {
      setError("WebSocket connection error")
      setConnected(false)
    }

    ws.onclose = () => {
      setConnected(false)
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [sessionId])

  return { traces, alerts, postmortems, connected, error }
}
