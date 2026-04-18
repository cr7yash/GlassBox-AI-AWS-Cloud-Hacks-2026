/**
 * API client for the simulator FastAPI control plane (Contract C)
 * and the GlassBox platform.
 */

import type { Scenario } from "./stadiums"
import type { Trace } from "./types"
import { humanizeAction, humanizeImpact, humanizeScenario, humanizeSeverity } from "./humanize"

const SIMULATOR_URL =
  process.env.NEXT_PUBLIC_SIMULATOR_URL ?? "http://localhost:8080"

// ---------------------------------------------------------------------------
// Simulator control plane (Role 2 FastAPI)
// ---------------------------------------------------------------------------

export async function startSession(
  stadiumId: string,
  scenario: Scenario,
): Promise<{ session_id: string }> {
  const res = await fetch(`${SIMULATOR_URL}/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stadium_id: stadiumId, scenario }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Failed to start session: ${res.status} ${detail}`)
  }
  return res.json()
}

export async function stopSession(sessionId: string): Promise<void> {
  const res = await fetch(`${SIMULATOR_URL}/session/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Failed to stop session: ${res.status} ${detail}`)
  }
}

export async function fetchStadiums(): Promise<unknown[]> {
  const res = await fetch(`${SIMULATOR_URL}/stadiums`)
  if (!res.ok) throw new Error(`Failed to fetch stadiums: ${res.status}`)
  return res.json()
}

export async function fetchHealth(): Promise<{ status: string; active_sessions: number }> {
  const res = await fetch(`${SIMULATOR_URL}/health`)
  if (!res.ok) throw new Error(`Failed to fetch health: ${res.status}`)
  return res.json()
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatTraceAsLogLines(trace: Trace): string[] {
  const ts = trace.timestamp.split("T")[1]?.replace("Z", "") ?? ""
  const lines: string[] = []

  lines.push(
    `[${ts}] Step ${trace.step} · ${trace.stadium_id} · ${humanizeScenario(trace.scenario)}`,
  )
  lines.push(
    `[${ts}] Environment → Outside ${trace.observation.outside_temp_f}°F · Inside ${trace.observation.inside_temp_f}°F · ${trace.observation.attendance.toLocaleString()} attendees · Grid $${trace.observation.grid_price_usd_mwh}/MWh`,
  )
  lines.push(`[${ts}] Manager reasoning → ${trace.thought}`)
  lines.push(
    `[${ts}] Manager decision → ${humanizeAction(trace.action)}`,
  )
  lines.push(
    `[${ts}] Impact → ${humanizeImpact(trace.impact.kwh_delta, trace.impact.dollars_delta, trace.impact.kg_co2_delta)}`,
  )

  if (trace.judge_score !== null && trace.judge_score !== undefined) {
    lines.push(
      `[${ts}] Judge verdict → Score ${trace.judge_score}/10 · ${humanizeSeverity(trace.severity)}`,
    )
  }
  if (trace.judge_reasoning) {
    lines.push(`[${ts}] Judge reasoning → ${trace.judge_reasoning}`)
  }
  if (trace.regulations_cited && trace.regulations_cited.length > 0) {
    for (const reg of trace.regulations_cited) {
      lines.push(`[${ts}] Regulation cited → ${reg.code}: ${reg.title}`)
    }
  }
  if (trace.guardrail_blocked) {
    lines.push(`[${ts}] ⚠️ GUARDRAIL BLOCKED — Action prevented by safety guardrails before execution`)
  }

  lines.push(
    `[${ts}] Performance → ${trace.tokens.input} input tokens / ${trace.tokens.output} output tokens · ${trace.latency_ms}ms latency`,
  )

  return lines
}
