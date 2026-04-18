/**
 * Human-readable labels for tool names, scenarios, and actions.
 */

import type { Action } from "./types"
import type { Scenario } from "./stadiums"

const TOOL_LABELS: Record<string, string> = {
  adjust_hvac: "Adjust HVAC",
  adjust_lighting: "Adjust Lighting",
  deploy_coolant: "Deploy Emergency Coolant",
  adjust_ventilation: "Adjust Ventilation",
  emit_alert: "Emit Alert",
  do_nothing: "No Action",
}

const SCENARIO_LABELS: Record<Scenario, string> = {
  normal: "Normal Operations",
  price_spike: "Energy Price Spike",
  sensor_fail: "Sensor Failure",
  api_broken: "Broken HVAC API",
  heat_wave: "Heat Wave",
}

export function humanizeTool(tool: string): string {
  return TOOL_LABELS[tool] ?? tool.replace(/_/g, " ")
}

export function humanizeScenario(scenario: Scenario): string {
  return SCENARIO_LABELS[scenario] ?? scenario.replace(/_/g, " ")
}

export function humanizeAction(action: Action): string {
  const tool = humanizeTool(action.tool)
  const args = action.args

  switch (action.tool) {
    case "adjust_hvac": {
      const temp = args.target_temp_f ?? "?"
      const zones = formatZones(args.zones)
      return `Set HVAC to ${temp}°F in ${zones}`
    }
    case "adjust_lighting": {
      const level = args.level_0_to_100 ?? args.level ?? "?"
      const zones = formatZones(args.zones)
      if (level === 0) return `Turn off lighting in ${zones}`
      return `Set lighting to ${level}% in ${zones}`
    }
    case "deploy_coolant": {
      const zones = formatZones(args.zones)
      return `Deploy emergency coolant in ${zones}`
    }
    case "adjust_ventilation": {
      const cfm = args.cfm ?? "?"
      const zones = formatZones(args.zones)
      return `Set ventilation to ${cfm} CFM in ${zones}`
    }
    case "emit_alert": {
      const sev = args.severity ?? "info"
      const msg = args.message ?? ""
      return `Alert (${sev}): ${msg}`
    }
    case "do_nothing":
      return "No action taken this cycle"
    default:
      return `${tool} — ${JSON.stringify(args)}`
  }
}

function formatZones(zones: unknown): string {
  if (!zones || !Array.isArray(zones)) return "all zones"
  if (zones.length === 0) return "all zones"
  if (zones.length === 1 && (zones[0] === "all" || zones[0] === "all_zones"))
    return "all zones"
  return zones.join(", ")
}

export function humanizeImpact(
  kwh: number,
  dollars: number,
  co2: number,
): string {
  const parts: string[] = []
  if (kwh !== 0) parts.push(`${Math.abs(kwh).toFixed(0)} kWh ${kwh < 0 ? "saved" : "used"}`)
  if (dollars !== 0) parts.push(`$${Math.abs(dollars).toFixed(2)} ${dollars < 0 ? "saved" : "spent"}`)
  if (co2 !== 0) parts.push(`${Math.abs(co2).toFixed(1)} kg CO₂ ${co2 < 0 ? "reduced" : "emitted"}`)
  return parts.join(" · ") || "No energy impact"
}

export function humanizeSeverity(severity: string | null | undefined): string {
  if (!severity) return "Pending"
  switch (severity) {
    case "critical": return "Critical Violation"
    case "warning": return "Warning"
    case "info": return "Safe"
    default: return severity
  }
}
