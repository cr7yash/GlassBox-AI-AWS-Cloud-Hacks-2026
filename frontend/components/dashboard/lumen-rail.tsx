"use client"

import { cn } from "@/lib/utils"

const lumenSteps = [
  { id: "lavender", label: "LAVENDER", threshold: 0 },
  { id: "amethyst", label: "AMETHYST", threshold: 0.22 },
  { id: "lilac", label: "LILAC ASH", threshold: 0.42 },
  { id: "charcoal", label: "CHARCOAL", threshold: 0.62 },
  { id: "shadow", label: "SHADOW", threshold: 0.82 },
]

type LumenRailProps = {
  /** 0–1 health signal (e.g. safety / 10). */
  health: number
}

export function LumenRail({ health }: LumenRailProps) {
  const h = Math.max(0, Math.min(1, health))

  return (
    <div className="rounded-xl border border-border bg-card/40 px-5 py-4 backdrop-blur-sm">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[10px] font-semibold tracking-[0.28em] text-muted-foreground">LUMEN SPECTRUM RAIL</h3>
          <p className="mt-1 text-sm text-muted-foreground/80">
            Audit chroma tracks judge safety · lavender → shadow grey
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {lumenSteps.map((s) => {
            const active = h >= s.threshold
            return (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className={cn("h-2 w-2 rounded-full", active ? "bg-lavender shadow-[0_0_10px_oklch(0.75_0.08_290/0.6)]" : "bg-muted")} />
                <span className={cn("text-[10px] font-medium tracking-wide", active ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full lumen-gradient">
        <div
          className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-foreground shadow-[0_0_10px_oklch(0.75_0.08_290/0.85)] transition-[left] duration-500 ease-out"
          style={{ left: `calc(${h * 100}% - 2px)` }}
        />
      </div>
    </div>
  )
}
