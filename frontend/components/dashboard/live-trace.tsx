"use client"

import { useEffect, useRef } from "react"

type LiveTraceProps = {
  lines: string[]
  step: number
}

export function LiveTrace({ lines, step }: LiveTraceProps) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [lines])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/50 shadow-inner">
      <div className="border-b border-border px-4 py-2">
        <span className="text-[10px] font-semibold tracking-[0.28em] text-muted-foreground">LIVE TRACE</span>
      </div>

      <div
        className="terminal-scrollbar h-52 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed sm:text-xs"
        aria-live="polite"
        aria-relevant="additions"
        role="log"
      >
        {lines.map((line, index) => (
          <div
            key={`${index}-${line.slice(0, 48)}`}
            className="mb-1.5 border-l border-transparent pl-2 text-muted-foreground transition-colors last:mb-0 hover:border-amethyst/40 hover:text-foreground/90"
          >
            {line}
          </div>
        ))}
        <div ref={endRef} className="h-px w-full" aria-hidden />
        <div className="mt-2 flex items-center gap-1">
          <span className="h-4 w-1.5 animate-pulse bg-lavender/80" />
        </div>
      </div>

      <div className="border-t border-border px-4 py-2 text-center text-[10px] text-muted-foreground">
        Simulation step <span className="font-mono text-foreground">{step}</span>
        {step === 0 ? " · press run to append pipeline logs" : null}
      </div>
    </div>
  )
}
