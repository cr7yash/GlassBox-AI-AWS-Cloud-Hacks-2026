"use client"

import { SlidersHorizontal, Building2, Scale, Share2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  { id: "simulator", name: "SIMULATOR", Icon: SlidersHorizontal },
  { id: "manager", name: "MANAGER", Icon: Building2 },
  { id: "judge", name: "JUDGE", Icon: Scale },
  { id: "glassex", name: "GLASSEX", Icon: Share2, warn: true },
] as const

type WorkflowPipelineProps = {
  /** 0–3 highlights an agent; -1 = idle (before first step). */
  activeIndex: number
}

export function WorkflowPipeline({ activeIndex }: WorkflowPipelineProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-y-6 px-4 py-6 sm:justify-between sm:px-8">
      {steps.map((step, index) => {
        const active = activeIndex >= 0 && index === activeIndex % steps.length
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div
                  className={cn(
                    "relative flex h-14 w-14 items-center justify-center rounded-full border bg-card/80 text-muted-foreground transition-all duration-300 sm:h-16 sm:w-16",
                    "border-border hover:border-lavender/50 hover:text-lavender",
                    active &&
                      "border-amethyst/60 text-lavender shadow-[0_0_0_1px_oklch(0.55_0.12_285/0.35),0_12px_40px_oklch(0.55_0.12_285/0.2)]",
                  )}
                >
                  {active ? (
                    <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-amethyst/35 animate-pulse" />
                  ) : null}
                  <step.Icon className="relative z-10 h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.35} />
                </div>
                {step.id === "glassex" ? (
                  <div
                    className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 bg-accent/25 shadow-[0_0_18px_oklch(0.65_0.15_85/0.35)]"
                    title="Audit flag"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                  </div>
                ) : null}
              </div>
              <span className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">
                {step.name}
              </span>
            </div>

            {index < steps.length - 1 ? (
              <div className="flex shrink-0 items-center px-3 sm:px-5">
                <div className="hidden h-px w-8 bg-border sm:block" />
                <span className="text-muted-foreground/60 sm:ml-1">→</span>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
