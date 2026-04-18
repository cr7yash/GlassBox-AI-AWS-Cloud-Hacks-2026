"use client"

import { cn } from "@/lib/utils"

const quadrants = [
  { id: "comfort", label: "COMFORT PRIORITY" },
  { id: "gold", label: "GOLD STANDARD" },
  { id: "crisis", label: "CRISIS ZONE" },
  { id: "unsafe", label: "UNSAFE GREEN" },
] as const

type SafetyQuadrantProps = {
  safety: number
  strain: number
  step: number
}

/** Strain on X (0 left → 10 right), safety on Y (0 bottom → 10 top). */
export function SafetyQuadrant({ safety, strain, step }: SafetyQuadrantProps) {
  const leftPct = Math.max(2, Math.min(98, (strain / 10) * 100))
  const bottomPct = Math.max(2, Math.min(98, (safety / 10) * 100))

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card/40">
      <div className="absolute left-0 top-0 bottom-0 flex w-9 items-center justify-center border-r border-dashed border-border/80 bg-background/30">
        <span className="whitespace-nowrap text-[10px] font-semibold tracking-[0.2em] text-muted-foreground [writing-mode:vertical-rl] rotate-180">
          SAFETY 0–10
        </span>
      </div>

      <div className="relative ml-9">
        <div className="grid h-44 grid-cols-2 grid-rows-2 sm:h-52">
          {quadrants.map((q) => (
            <div
              key={q.id}
              className={cn(
                "flex items-center justify-center border border-border/40 px-1 text-center transition-colors",
                "hover:bg-muted/20",
              )}
            >
              <span className="text-[10px] font-medium tracking-wider text-muted-foreground">{q.label}</span>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-2 rounded-md border border-dashed border-amethyst/15" />
          <div className="absolute bottom-2 left-1/2 top-2 w-px -translate-x-1/2 bg-border/50" />
          <div className="absolute left-2 right-2 top-1/2 h-px -translate-y-1/2 bg-border/50" />
          <div
            key={step}
            className="absolute h-3.5 w-3.5 rounded-full border-2 border-lavender bg-amethyst/40 shadow-[0_0_22px_oklch(0.75_0.08_290/0.45)] transition-all duration-500 ease-out"
            style={{
              left: `${leftPct}%`,
              bottom: `${bottomPct}%`,
              transform: "translate(-50%, 50%)",
            }}
            title={`Safety ${safety.toFixed(1)} · Strain ${strain.toFixed(1)}`}
          />
        </div>
      </div>

      <div className="ml-9 flex justify-between border-t border-border/60 px-3 py-2 font-mono text-[10px] text-muted-foreground">
        <span>
          Strain <span className="text-lavender">{strain.toFixed(2)}</span>/10
        </span>
        <span>
          Safety <span className="text-amethyst">{safety.toFixed(2)}</span>/10
        </span>
      </div>

      <div className="border-t border-border/60 py-1.5 text-center text-[10px] tracking-[0.25em] text-muted-foreground">
        STRAIN 0–10
      </div>
    </div>
  )
}
