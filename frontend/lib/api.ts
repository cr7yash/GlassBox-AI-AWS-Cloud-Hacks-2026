/**
 * API client for the simulator FastAPI control plane (Contract C)
 * and the GlassBox platform.
 */

import type { Scenario } from "./stadiums"
import type { Trace } from "./types"

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
// Interim polling mode (before Role 3 WebSocket is ready)
// ---------------------------------------------------------------------------

/**
 * Poll the simulator's traces endpoint for new traces.
 * This is a temporary bridge until the WebSocket infra is deployed.
 * The simulator would need a GET /traces/{session_id} endpoint for this.
 * For now, traces come through the WebSocket hook.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatTraceAsLogLines(trace: Trace): string[] {
  const ts = trace.timestamp.split("T")[1]?.replace("Z", "") ?? ""
  const lines: string[] = []

  lines.push(
    `[${ts}] step=${trace.step} · ${trace.stadium_id} · ${trace.scenario}`,
  )
  lines.push(
    `[${ts}] observation → temp_out=${trace.observation.outside_temp_f}°F · temp_in=${trace.observation.inside_temp_f}°F · attendance=${trace.observation.attendance.toLocaleString()} · grid=$${trace.observation.grid_price_usd_mwh}/MWh`,
  )
  lines.push(`[${ts}] manager.thought → ${trace.thought}`)
  lines.push(
    `[${ts}] manager.action → ${trace.action.tool}(${JSON.stringify(trace.action.args)})`,
  )
  lines.push(
    `[${ts}] impact → kWh=${trace.impact.kwh_delta} · $=${trace.impact.dollars_delta} · CO₂=${trace.impact.kg_co2_delta}kg`,
  )

  if (trace.judge_score !== null) {
    lines.push(
      `[${ts}] judge.score → ${trace.judge_score}/10 · severity=${trace.severity}`,
    )
  }
  if (trace.judge_reasoning) {
    lines.push(`[${ts}] judge.reasoning → ${trace.judge_reasoning}`)
  }
  if (trace.regulations_cited.length > 0) {
    for (const reg of trace.regulations_cited) {
      lines.push(`[${ts}] regulation → ${reg.code}: ${reg.title}`)
    }
  }
  if (trace.guardrail_blocked) {
    lines.push(`[${ts}] ⚠️ GUARDRAIL BLOCKED — action prevented by safety guardrails`)
  }

  lines.push(
    `[${ts}] tokens=${trace.tokens.input}in/${trace.tokens.output}out · latency=${trace.latency_ms}ms`,
  )

  return lines
}
