"use client"

import { useMemo } from "react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ReferenceArea,
} from "recharts"
import type { Trace } from "@/lib/types"
import { humanizeAction, humanizeImpact, humanizeSeverity } from "@/lib/humanize"

type QuadrantDot = {
  x: number // cumulative kg_co2_delta (inverted: positive = saved)
  y: number // judge_score 0-10
  z: number // abs(dollars_delta) for sizing
  severity: string | null
  step: number
  actionLabel: string
  impactLabel: string
  thought: string
  isLatest: boolean
}

const SEVERITY_COLORS: Record<string, string> = {
  info: "#4ade80",     // green
  warning: "#fbbf24",  // amber
  critical: "#ef4444", // red
}
const DEFAULT_COLOR = "#a78bfa" // lavender for null severity

/** Estimate a safety score from observation when judge hasn't scored yet. */
function estimateSafety(trace: Trace): number {
  const obs = trace.observation
  let score = 8 // start optimistic
  // Penalize extreme inside temps
  if (obs.inside_temp_f > 82) score -= Math.min(3, (obs.inside_temp_f - 82) / 5)
  if (obs.inside_temp_f > 100) score -= 3 // sensor fail territory
  // Penalize lighting off with attendance
  if (obs.lighting_state === "off" && obs.attendance > 0) score -= 4
  // Penalize extreme outside temps
  if (obs.outside_temp_f > 110) score -= 1
  // Guardrail blocked = something was wrong
  if (trace.guardrail_blocked) score -= 2
  return Math.max(0, Math.min(10, score))
}

function dotColor(severity: string | null): string {
  if (!severity) return DEFAULT_COLOR
  return SEVERITY_COLORS[severity] ?? DEFAULT_COLOR
}

function dotSize(dollarsDelta: number): number {
  const base = 60
  const scale = Math.min(Math.abs(dollarsDelta) * 2, 300)
  return base + scale
}

type SafetyQuadrantProps = {
  traces: Trace[]
}

export function SafetyQuadrant({ traces }: SafetyQuadrantProps) {
  const dots = useMemo<QuadrantDot[]>(() => {
    let cumulativeCo2 = 0
    return traces.map((t, i) => {
      cumulativeCo2 += t.impact.kg_co2_delta
      return {
        x: -cumulativeCo2, // invert: positive = emissions saved
        y: t.judge_score ?? estimateSafety(t),
        z: Math.abs(t.impact.dollars_delta),
        severity: t.severity,
        step: t.step,
        actionLabel: humanizeAction(t.action),
        impactLabel: humanizeImpact(t.impact.kwh_delta, t.impact.dollars_delta, t.impact.kg_co2_delta),
        thought: t.thought.slice(0, 120),
        isLatest: i === traces.length - 1,
      }
    })
  }, [traces])

  const xMin = dots.length > 0 ? Math.min(...dots.map((d) => d.x), 0) - 5 : -50
  const xMax = dots.length > 0 ? Math.max(...dots.map((d) => d.x), 0) + 5 : 50

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/40">
      <div className="border-b border-border px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.28em] text-muted-foreground">
          SAFETY × SUSTAINABILITY QUADRANT
        </span>
        <div className="flex items-center gap-3">
          {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
            <div key={sev} className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-muted-foreground capitalize">{sev}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-2 py-3">
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />

            {/* Quadrant shading */}
            <ReferenceArea x1={0} x2={xMax} y1={7} y2={10} fill="#4ade80" fillOpacity={0.04} />
            <ReferenceArea x1={xMin} x2={0} y1={7} y2={10} fill="#fbbf24" fillOpacity={0.04} />
            <ReferenceArea x1={0} x2={xMax} y1={0} y2={3} fill="#ef4444" fillOpacity={0.06} />
            <ReferenceArea x1={xMin} x2={0} y1={0} y2={3} fill="#ef4444" fillOpacity={0.04} />

            {/* Axis lines */}
            <ReferenceLine y={5} stroke="hsl(var(--border))" strokeDasharray="4 4" />
            <ReferenceLine x={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />

            <XAxis
              type="number"
              dataKey="x"
              domain={[xMin, xMax]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              label={{
                value: "Emissions Saved (kg CO₂) →",
                position: "bottom",
                offset: 0,
                style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 10]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              label={{
                value: "Safety Score",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
              }}
            />

            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null
                const d = payload[0].payload as QuadrantDot
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                    <div className="font-semibold text-foreground">Step {d.step} — {d.actionLabel}</div>
                    <div className="text-muted-foreground">Safety: {d.y}/10 · {humanizeSeverity(d.severity)}</div>
                    <div className="text-muted-foreground">{d.impactLabel}</div>
                    <div className="mt-1 text-muted-foreground/80 italic max-w-56 line-clamp-2">{d.thought}</div>
                  </div>
                )
              }}
            />

            <Scatter data={dots} isAnimationActive={false}>
              {dots.map((dot, i) => (
                <Cell
                  key={`dot-${i}`}
                  fill={dotColor(dot.severity)}
                  fillOpacity={dot.isLatest ? 1 : 0.6}
                  stroke={dot.isLatest ? "#fff" : "none"}
                  strokeWidth={dot.isLatest ? 2 : 0}
                  r={Math.sqrt(dotSize(dot.z)) / 2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Quadrant labels */}
      <div className="grid grid-cols-2 border-t border-border/60 text-center text-[9px] tracking-wider text-muted-foreground/60">
        <div className="border-r border-border/40 py-1">← WASTEFUL</div>
        <div className="py-1">GREEN →</div>
      </div>
    </div>
  )
}
