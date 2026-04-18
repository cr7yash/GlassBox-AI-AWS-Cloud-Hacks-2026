/**
 * Client-side simulation helpers.
 *
 * These are kept as fallback for local development when the backend
 * simulator is not running. The dashboard now primarily uses real API
 * calls via lib/api.ts and WebSocket via hooks/use-glassbox-stream.ts.
 */

import type { Scenario } from "@/lib/stadiums"

export type ChaosMode = Scenario

export function chaosLabel(mode: ChaosMode): string {
  const labels: Record<ChaosMode, string> = {
    normal: "Normal operations",
    price_spike: "Energy price spike",
    sensor_fail: "Sensor failure",
    api_broken: "Broken HVAC API",
    heat_wave: "Heat wave",
  }
  return labels[mode]
}
