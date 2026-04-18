"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Scale, ShieldAlert } from "lucide-react"
import type { Trace } from "@/lib/types"
import { humanizeAction } from "@/lib/humanize"
import { cn } from "@/lib/utils"

type AuditorFeedProps = {
  traces: Trace[]
}

const severityConfig = {
  critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: ShieldAlert },
  warning: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: Scale },
  info: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", icon: Scale },
}

export function AuditorFeed({ traces }: AuditorFeedProps) {
  // Only show traces with judge verdicts (severity != null)
  const judged = traces.filter((t) => t.severity !== null && t.judge_score !== null)

  if (judged.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/50 px-4 py-6 text-center">
        <Scale className="mx-auto h-6 w-6 text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground">No judge verdicts yet — waiting for traces to be audited.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      <div className="border-b border-border px-4 py-2">
        <span className="text-[10px] font-semibold tracking-[0.28em] text-muted-foreground">
          AUDITOR FEED
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
        {judged.slice().reverse().map((trace) => (
          <VerdictRow key={trace.trace_id ?? trace.step} trace={trace} />
        ))}
      </div>
    </div>
  )
}

function VerdictRow({ trace }: { trace: Trace }) {
  const [expanded, setExpanded] = useState(false)
  const sev = trace.severity ?? "info"
  const config = severityConfig[sev] ?? severityConfig.info
  const Icon = config.icon

  return (
    <div className={cn("px-4 py-3", config.bg)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 text-left"
      >
        <div className={cn("mt-0.5 shrink-0 rounded-full p-1", config.border, "border")}>
          <Icon className={cn("h-3 w-3", config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold uppercase tracking-wide", config.color)}>
              {sev}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Step {trace.step} · Score {trace.judge_score}/10
            </span>
          </div>
          <p className="mt-0.5 text-xs text-foreground/80 line-clamp-2">
            {trace.judge_reasoning}
          </p>
        </div>

        <div className="shrink-0 mt-1 text-muted-foreground">
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-2 ml-9 space-y-2">
          {/* Regulation citations */}
          {trace.regulations_cited && trace.regulations_cited.length > 0 && (
            <div className="space-y-1.5">
              {trace.regulations_cited.map((reg, i) => (
                <div key={i} className="rounded border border-border/60 bg-background/40 px-3 py-2">
                  <div className="text-[10px] font-semibold text-amber-400 tracking-wide">{reg.code}</div>
                  <div className="text-[10px] text-muted-foreground">{reg.title}</div>
                  <div className="mt-1 text-[11px] text-foreground/70 italic">&ldquo;{reg.excerpt}&rdquo;</div>
                </div>
              ))}
            </div>
          )}

          {/* Action that was judged */}
          <div className="text-[10px] text-muted-foreground">
            Decision: <span className="text-foreground/70">{humanizeAction(trace.action)}</span>
          </div>

          {trace.guardrail_blocked && (
            <div className="text-[10px] text-purple-400">
              ⚠️ This action was also blocked by Guardrails
            </div>
          )}
        </div>
      )}
    </div>
  )
}
