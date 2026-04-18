"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, Wifi, WifiOff } from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { stadiums, scenarios, type Scenario } from "@/lib/stadiums"
import { startSession, stopSession, formatTraceAsLogLines } from "@/lib/api"
import { useGlassboxStream } from "@/hooks/use-glassbox-stream"
import { useTracePolling } from "@/hooks/use-trace-polling"
import type { Trace } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WorkflowPipeline } from "./workflow-pipeline"
import { SafetyQuadrant } from "./safety-quadrant"
import { LiveTrace } from "./live-trace"
import { LumenRail } from "./lumen-rail"
import { AuditorFeed } from "./auditor-feed"
import { PostmortemModal } from "./postmortem-modal"
import { CriticalAlertToast } from "./critical-alert-toast"
import { cn } from "@/lib/utils"

const INITIAL_TRACE: TraceLine[] = [
  { text: "[system] GlassBox v3 · Lumen spectrum rail online" },
  { text: "[system] Select a stadium and scenario, then start session to stream live agent traces." },
]

type TraceLine = {
  text: string
  severity?: "info" | "warning" | "critical" | null
}

export function Dashboard() {
  const selectedStadium = useAppState((s) => s.selectedStadium)
  const selectedScenario = useAppState((s) => s.selectedScenario)
  const sessionId = useAppState((s) => s.sessionId)
  const goBackToGlobe = useAppState((s) => s.goBackToGlobe)
  const setSelectedStadium = useAppState((s) => s.setSelectedStadium)
  const setSelectedScenario = useAppState((s) => s.setSelectedScenario)
  const setSessionId = useAppState((s) => s.setSessionId)

  const [traceLines, setTraceLines] = useState<TraceLine[]>(INITIAL_TRACE)
  const [allTraces, setAllTraces] = useState<Trace[]>([])
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // WebSocket stream (connects when sessionId is set and WS_URL is configured)
  const { traces: wsTraces, alerts, postmortems, connected } = useGlassboxStream(sessionId)

  // Polling fallback (when WebSocket isn't available)
  const { traces: polledTraces } = useTracePolling(!connected ? sessionId : null)

  // Use whichever source has traces
  const incomingTraces = connected ? wsTraces : polledTraces

  // Append new traces to log (from WebSocket or polling)
  useEffect(() => {
    if (incomingTraces.length === 0) return
    const latest = incomingTraces[incomingTraces.length - 1]
    if (allTraces.length < incomingTraces.length) {
      setAllTraces(incomingTraces)
      const newLines = formatTraceAsLogLines(latest).map((text) => ({
        text,
        severity: latest.severity,
      }))
      setTraceLines((prev) => [...prev, ...newLines])
    }
  }, [incomingTraces, allTraces.length])

  // Derived metrics from latest trace
  const latestTrace = allTraces[allTraces.length - 1] ?? null

  // Safety: use judge_score if available, otherwise estimate from observation
  const safety = latestTrace?.judge_score
    ?? (latestTrace ? Math.max(0, Math.min(10, 10 - (latestTrace.observation.inside_temp_f - 68) / 5)) : 7.4)

  // Cumulative impact across all traces
  const cumulativeImpact = useMemo(() => {
    let kwh = 0, dollars = 0, co2 = 0
    for (const t of allTraces) {
      kwh += t.impact.kwh_delta
      dollars += t.impact.dollars_delta
      co2 += t.impact.kg_co2_delta
    }
    return { kwh, dollars, co2 }
  }, [allTraces])

  const status = useMemo<"Ready" | "Live" | "Degraded">(() => {
    if (!sessionId) return "Ready"
    if (latestTrace?.severity === "critical") return "Degraded"
    if (latestTrace?.guardrail_blocked) return "Degraded"
    return "Live"
  }, [sessionId, latestTrace])

  const handleStadiumChange = (stadiumId: string) => {
    const stadium = stadiums.find((s) => s.id === stadiumId)
    if (stadium) {
      setSelectedStadium(stadium)
      setSelectedScenario(stadium.signatureScenario)
    }
  }

  const handleStart = useCallback(async () => {
    if (!selectedStadium || isStarting) return
    setIsStarting(true)
    setError(null)
    try {
      const { session_id } = await startSession(selectedStadium.id, selectedScenario)
      setSessionId(session_id)
      setTraceLines((prev) => [
        ...prev,
        { text: `[system] Session started: ${session_id}` },
        { text: `[system] Stadium: ${selectedStadium.name} · Scenario: ${selectedScenario}` },
        { text: `[system] Streaming traces every 5s...` },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
      setTraceLines((prev) => [...prev, { text: `[error] Failed to start session: ${msg}`, severity: "critical" as const }])
    } finally {
      setIsStarting(false)
    }
  }, [selectedStadium, selectedScenario, isStarting, setSessionId])

  const handleStop = useCallback(async () => {
    if (!sessionId) return
    try {
      await stopSession(sessionId)
      setTraceLines((prev) => [...prev, { text: `[system] Session ${sessionId} stopped.` }])
    } catch {
      // Session may already be stopped
    }
    setSessionId(null)
  }, [sessionId, setSessionId])

  // Determine active pipeline agent from latest trace
  const activeAgent = latestTrace
    ? latestTrace.agent === "manager"
      ? 1
      : latestTrace.agent === "judge"
        ? 2
        : -1
    : -1

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background px-4 py-6 sm:px-8">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,oklch(0.55_0.12_285/0.12),transparent)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { handleStop(); goBackToGlobe() }}
              className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Back to globe"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="bg-gradient-to-r from-lavender via-foreground to-lilac-ash bg-clip-text text-xl font-semibold tracking-tight text-transparent sm:text-2xl">
                GlassBox AI v3: Stadium Audit
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Live agent observability — simulator → manager → judge → audit, with real-time safety telemetry.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <StatusBadge label="STATUS" value={status} tone={status === "Degraded" ? "bad" : status === "Live" ? "live" : "ready"} />
            <StatusBadge label="STADIUM" value={selectedStadium?.name ?? "—"} tone="neutral" />
            {sessionId && (
              <div className="flex items-center gap-1 rounded-full border border-border/80 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
                {connected ? (
                  <Wifi className="h-3 w-3 text-amethyst" />
                ) : (
                  <WifiOff className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-[10px] font-medium text-muted-foreground">
                  {connected ? "LIVE" : "POLLING"}
                </span>
              </div>
            )}
          </div>
        </header>

        <div className="mb-6">
          <LumenRail health={safety / 10} />
        </div>

        {/* Guardrail blocked banner */}
        {latestTrace?.guardrail_blocked && (
          <div className="mb-4 rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">
            ⚠️ Action blocked by Guardrails before Judge evaluation — safety layer intervened.
          </div>
        )}

        {/* Critical alert banner */}
        {latestTrace?.severity === "critical" && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            🚨 CRITICAL — {latestTrace.judge_reasoning}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-6 rounded-2xl border border-border/80 bg-card/30 p-4 shadow-[0_24px_80px_oklch(0_0_0/0.35)] backdrop-blur-md sm:p-6">
          <div className="rounded-xl border border-border/60 bg-background/40">
            <WorkflowPipeline activeIndex={activeAgent} />
          </div>

          <div className="mx-auto max-w-2xl">
            <SafetyQuadrant traces={allTraces} />
          </div>

          {/* Stadium profile card */}
          {selectedStadium && !latestTrace && (
            <div className="rounded-xl border border-border/60 bg-card/50 px-4 py-3">
              <div className="text-sm font-semibold text-foreground">{selectedStadium.name}</div>
              <div className="text-xs text-muted-foreground">{selectedStadium.city}, {selectedStadium.country} · {selectedStadium.capacity.toLocaleString()} capacity · {selectedStadium.climateProfile.replace(/_/g, " ")}</div>
            </div>
          )}

          {/* Facility state from latest observation */}
          {latestTrace && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricTile label="OUTSIDE TEMP" value={`${latestTrace.observation.outside_temp_f}°F`} />
              <MetricTile label="INSIDE TEMP" value={`${latestTrace.observation.inside_temp_f}°F`} />
              <MetricTile label="ATTENDANCE" value={latestTrace.observation.attendance.toLocaleString()} />
              <MetricTile label="GRID PRICE" value={`$${latestTrace.observation.grid_price_usd_mwh}/MWh`} />
            </div>
          )}

          {/* Cumulative impact counters */}
          {allTraces.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <MetricTile label="ENERGY" value={`${Math.abs(cumulativeImpact.kwh).toFixed(0)} kWh ${cumulativeImpact.kwh < 0 ? "saved" : "used"}`} />
              <MetricTile label="COST" value={`$${Math.abs(cumulativeImpact.dollars).toFixed(2)} ${cumulativeImpact.dollars < 0 ? "saved" : "spent"}`} />
              <MetricTile label="CARBON" value={`${Math.abs(cumulativeImpact.co2).toFixed(1)} kg CO₂ ${cumulativeImpact.co2 < 0 ? "reduced" : "emitted"}`} />
            </div>
          )}

          <LiveTrace lines={traceLines} step={allTraces.length} />

          <AuditorFeed traces={allTraces} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-semibold tracking-[0.22em] text-muted-foreground">STADIUM</label>
              <Select value={selectedStadium?.id ?? ""} onValueChange={handleStadiumChange} disabled={!!sessionId}>
                <SelectTrigger className="h-11 border-border bg-card/80">
                  <SelectValue placeholder="Select stadium" />
                </SelectTrigger>
                <SelectContent>
                  {stadiums.map((stadium) => (
                    <SelectItem key={stadium.id} value={stadium.id}>
                      {stadium.name} — {stadium.city}, {stadium.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold tracking-[0.22em] text-muted-foreground">SCENARIO</label>
              <Select value={selectedScenario} onValueChange={(v) => setSelectedScenario(v as Scenario)} disabled={!!sessionId}>
                <SelectTrigger className="h-11 border-border bg-card/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!sessionId ? (
            <Button
              className="h-12 w-full border border-amethyst/30 bg-gradient-to-r from-amethyst/15 to-lavender/10 font-medium tracking-wide text-foreground shadow-sm transition hover:border-lavender/40 hover:shadow-[0_0_28px_oklch(0.55_0.12_285/0.25)]"
              onClick={handleStart}
              disabled={!selectedStadium || isStarting}
            >
              {isStarting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-lavender border-t-transparent" />
                  Starting session…
                </span>
              ) : (
                "Start simulation session"
              )}
            </Button>
          ) : (
            <Button
              variant="destructive"
              className="h-12 w-full font-medium tracking-wide"
              onClick={handleStop}
            >
              Stop session
            </Button>
          )}
        </div>
      </div>

      {/* Floating overlays */}
      <PostmortemModal postmortems={postmortems} />
      <CriticalAlertToast alerts={alerts} />
    </div>
  )
}

function StatusBadge({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "ready" | "live" | "bad" | "neutral"
}) {
  return (
    <div className="rounded-full border border-border/80 bg-card/60 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "ml-2 text-xs font-medium",
          tone === "ready" && "text-lavender",
          tone === "live" && "text-amethyst",
          tone === "bad" && "text-destructive",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 text-center">
      <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm text-foreground">{value}</div>
    </div>
  )
}
