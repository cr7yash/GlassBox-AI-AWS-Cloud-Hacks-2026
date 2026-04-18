import type { Stadium } from "@/lib/stadiums"

export type ChaosMode =
  | "normal"
  | "heatwave"
  | "crowd-surge"
  | "power-outage"
  | "weather-alert"

export function previewTelemetry(chaos: ChaosMode): { safety: number; strain: number } {
  switch (chaos) {
    case "normal":
      return { safety: 7.4, strain: 3.2 }
    case "heatwave":
      return { safety: 5.1, strain: 7.8 }
    case "crowd-surge":
      return { safety: 5.6, strain: 8.4 }
    case "power-outage":
      return { safety: 3.8, strain: 8.9 }
    case "weather-alert":
      return { safety: 6.0, strain: 6.5 }
    default:
      return { safety: 6, strain: 5 }
  }
}

function padTime(): string {
  const d = new Date()
  const hh = d.getHours().toString().padStart(2, "0")
  const mm = d.getMinutes().toString().padStart(2, "0")
  const ss = d.getSeconds().toString().padStart(2, "0")
  const ms = d.getMilliseconds().toString().padStart(3, "0")
  return `${hh}:${mm}:${ss}.${ms}`
}

export function runSimulationStep(
  step: number,
  chaos: ChaosMode,
  stadium: Stadium,
): { safety: number; strain: number; lines: string[] } {
  const base = previewTelemetry(chaos)
  const wave = Math.sin(step * 0.85) * 0.35
  const wave2 = Math.cos(step * 0.55) * 0.28
  const safety = Math.max(0, Math.min(10, base.safety + wave + step * 0.012))
  const strain = Math.max(0, Math.min(10, base.strain + wave2 - step * 0.006))
  const t = padTime()
  const tempF = Math.round(88 + strain * 2.1 + (chaos === "heatwave" ? 9 : 0))
  const grid = (0.32 + strain / 22 + (chaos === "power-outage" ? 0.18 : 0)).toFixed(2)
  const verdict = safety < 4 ? "DEGRADED" : safety < 6 ? "WATCH" : "OK"

  const lines = [
    `[${t}] step=${step} · ${stadium.name} · ${chaos.replace("-", " ")}`,
    `[${t}] simulator.tick → outside_temp=${tempF}°F · grid=$${grid}/kWh · cap≈${(stadium.capacity / 1000).toFixed(0)}k`,
    `[${t}] manager.route → precool_reserve=${(100 - strain * 9).toFixed(0)}% · concourse_lux=${(72 - strain).toFixed(0)}%`,
    `[${t}] judge.score → safety=${safety.toFixed(2)}/10 · strain_index=${strain.toFixed(2)}`,
    `[${t}] glassex.audit → frame=v3.1.2 · verdict=${verdict}`,
  ]

  return { safety, strain, lines }
}

export function chaosLabel(mode: ChaosMode): string {
  const labels: Record<ChaosMode, string> = {
    normal: "Normal operations",
    heatwave: "Heatwave scenario",
    "crowd-surge": "Crowd surge",
    "power-outage": "Power outage",
    "weather-alert": "Weather alert",
  }
  return labels[mode]
}
