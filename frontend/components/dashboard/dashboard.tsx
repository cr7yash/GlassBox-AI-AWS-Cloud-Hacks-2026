"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { stadiums } from "@/lib/stadiums"
import {
  type ChaosMode,
  chaosLabel,
  previewTelemetry,
  runSimulationStep,
} from "@/lib/simulation"
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
import { cn } from "@/lib/utils"

const chaosOptions: { value: ChaosMode; label: string }[] = [
  { value: "normal", label: "Normal operations" },
  { value: "heatwave", label: "Heatwave scenario" },
  { value: "crowd-surge", label: "Crowd surge" },
  { value: "power-outage", label: "Power outage" },
  { value: "weather-alert", label: "Weather alert" },
]

const INITIAL_TRACE = [
  "[system] GlassBox v3 · Lumen spectrum rail online",
  "[system] Tune chaos + stadium, then run simulation step to stream agents.",
]

export function Dashboard() {
  const selectedStadium = useAppState((state) => state.selectedStadium)
  const goBackToGlobe = useAppState((state) => state.goBackToGlobe)
  const setSelectedStadium = useAppState((state) => state.setSelectedStadium)

  const [chaosMode, setChaosMode] = useState<ChaosMode>("normal")
  const [step, setStep] = useState(0)
  const [trace, setTrace] = useState<string[]>(INITIAL_TRACE)
  const [safety, setSafety] = useState(() => previewTelemetry("normal").safety)
  const [strain, setStrain] = useState(() => previewTelemetry("normal").strain)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    const p = previewTelemetry(chaosMode)
    setSafety(p.safety)
    setStrain(p.strain)
  }, [chaosMode])

  useEffect(() => {
    setStep(0)
    setTrace(INITIAL_TRACE)
  }, [selectedStadium?.id])

  const status = useMemo<"Ready" | "Live" | "Degraded">(() => {
    if (step === 0) return "Ready"
    if (safety < 4) return "Degraded"
    return "Live"
  }, [safety, step])

  const handleStadiumChange = (stadiumId: string) => {
    const stadium = stadiums.find((s) => s.id === stadiumId)
    if (stadium) setSelectedStadium(stadium)
  }

  const runStep = useCallback(() => {
    if (!selectedStadium || isRunning) return
    setIsRunning(true)
    const next = step + 1
    const { safety: s, strain: r, lines } = runSimulationStep(next, chaosMode, selectedStadium)
    setStep(next)
    setSafety(s)
    setStrain(r)
    setTrace((prev) => [...prev, ...lines])
    window.setTimeout(() => setIsRunning(false), 480)
  }, [chaosMode, isRunning, selectedStadium, step])

  const activeAgent = step > 0 ? (step - 1) % 4 : -1

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
              onClick={goBackToGlobe}
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
                Observability canvas in the Lumen palette — simulator → manager → judge → GlasseX, with live safety / strain telemetry.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <StatusBadge label="STATUS" value={status} tone={status === "Degraded" ? "bad" : status === "Live" ? "live" : "ready"} />
            <StatusBadge label="STADIUM" value={selectedStadium?.name ?? "—"} tone="neutral" />
            <StatusBadge label="AUDIT" value="v3.1.2-beta" tone="neutral" />
          </div>
        </header>

        <div className="mb-6">
          <LumenRail health={safety / 10} />
        </div>

        <div className="space-y-6 rounded-2xl border border-border/80 bg-card/30 p-4 shadow-[0_24px_80px_oklch(0_0_0/0.35)] backdrop-blur-md sm:p-6">
          <div className="rounded-xl border border-border/60 bg-background/40">
            <WorkflowPipeline activeIndex={activeAgent} />
          </div>

          <div className="mx-auto max-w-2xl">
            <SafetyQuadrant safety={safety} strain={strain} step={step} />
          </div>

          <LiveTrace lines={trace} step={step} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-semibold tracking-[0.22em] text-muted-foreground">STADIUM</label>
              <Select value={selectedStadium?.id ?? ""} onValueChange={handleStadiumChange}>
                <SelectTrigger className="h-11 border-border bg-card/80">
                  <SelectValue placeholder="Select stadium" />
                </SelectTrigger>
                <SelectContent>
                  {stadiums.map((stadium) => (
                    <SelectItem key={stadium.id} value={stadium.id}>
                      {stadium.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold tracking-[0.22em] text-muted-foreground">CHAOS SWITCH</label>
              <Select
                value={chaosMode}
                onValueChange={(v) => {
                  setChaosMode(v as ChaosMode)
                  setTrace((prev) => [
                    ...prev,
                    `[system] chaos → ${chaosLabel(v as ChaosMode)} · preview telemetry refreshed`,
                  ])
                }}
              >
                <SelectTrigger className="h-11 border-border bg-card/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chaosOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="h-12 w-full border border-amethyst/30 bg-gradient-to-r from-amethyst/15 to-lavender/10 font-medium tracking-wide text-foreground shadow-sm transition hover:border-lavender/40 hover:shadow-[0_0_28px_oklch(0.55_0.12_285/0.25)]"
            onClick={runStep}
            disabled={!selectedStadium || isRunning}
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-lavender border-t-transparent" />
                Running step…
              </span>
            ) : (
              "Run simulation step"
            )}
          </Button>
        </div>
      </div>
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
