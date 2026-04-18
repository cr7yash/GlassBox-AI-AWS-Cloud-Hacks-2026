"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type TraceLine = {
  text: string
  severity?: "info" | "warning" | "critical" | null
}

type LiveTraceProps = {
  lines: TraceLine[]
  step: number
}

function lineColor(line: TraceLine): string {
  // Check for explicit severity
  if (line.severity === "critical") return "text-red-400"
  if (line.severity === "warning") return "text-amber-400"
  if (line.severity === "info") return "text-green-400"

  // Infer from content (matches humanized text)
  const t = line.text
  if (t.includes("GUARDRAIL BLOCKED") || t.includes("CRITICAL")) return "text-red-400"
  if (t.includes("[error]")) return "text-red-400"
  if (t.includes("Judge verdict") || t.includes("Judge reasoning")) return "text-amber-300"
  if (t.includes("Regulation cited")) return "text-amber-400"
  if (t.includes("[system]")) return "text-lavender"
  if (t.includes("Manager reasoning")) return "text-foreground/80"
  if (t.includes("Manager decision")) return "text-amethyst"
  if (t.includes("Environment")) return "text-muted-foreground/90"
  if (t.includes("Impact")) return "text-green-400/80"
  if (t.includes("Performance")) return "text-muted-foreground/60"

  return "text-muted-foreground"
}

export function LiveTrace({ lines, step }: LiveTraceProps) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [lines])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/50 shadow-inner">
      <div className="border-b border-border px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.28em] text-muted-foreground">LIVE TRACE</span>
        <span className="text-[10px] font-mono text-muted-foreground">{lines.length} lines</span>
      </div>

      <div
        className="terminal-scrollbar h-52 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed sm:text-xs"
        aria-live="polite"
        aria-relevant="additions"
        role="log"
      >
        {lines.map((line, index) => (
          <div
            key={`${index}-${line.text.slice(0, 48)}`}
            className={cn(
              "mb-1.5 border-l-2 pl-2 transition-colors last:mb-0 hover:brightness-125",
              lineColor(line),
              line.severity === "critical"
                ? "border-red-500/60"
                : line.severity === "warning"
                  ? "border-amber-500/40"
                  : "border-transparent",
            )}
          >
            {line.text}
          </div>
        ))}
        <div ref={endRef} className="h-px w-full" aria-hidden />
        <div className="mt-2 flex items-center gap-1">
          <span className="h-4 w-1.5 animate-pulse bg-lavender/80" />
        </div>
      </div>

      <div className="border-t border-border px-4 py-2 text-center text-[10px] text-muted-foreground">
        Simulation step <span className="font-mono text-foreground">{step}</span>
        {step === 0 ? " · start a session to stream agent traces" : null}
      </div>
    </div>
  )
}
