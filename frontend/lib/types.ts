/**
 * Trace types matching backend/simulator/schemas.py and Technical-doc §3.1.
 */

import type { Scenario } from "./stadiums"

export interface Observation {
  outside_temp_f: number
  inside_temp_f: number
  attendance: number
  grid_price_usd_mwh: number
  grid_co2_g_kwh: number
  hvac_state: string
  lighting_state: string
}

export interface Action {
  tool: string
  args: Record<string, unknown>
}

export interface Impact {
  dollars_delta: number
  kwh_delta: number
  kg_co2_delta: number
}

export interface TokenUsage {
  input: number
  output: number
}

export interface RegulationCitation {
  code: string
  title: string
  excerpt: string
}

export type Severity = "info" | "warning" | "critical"

export interface Trace {
  trace_id: string
  session_id: string
  stadium_id: string
  scenario: Scenario
  timestamp: string
  step: number
  agent: "manager" | "judge"
  observation: Observation
  thought: string
  action: Action
  judge_score: number | null
  judge_reasoning: string | null
  regulations_cited: RegulationCitation[]
  severity: Severity | null
  impact: Impact
  tokens: TokenUsage
  latency_ms: number
  polly_audio_url: string | null
  postmortem_md: string | null
  guardrail_blocked: boolean
  guardrail_intervention: Record<string, unknown> | null
}

export interface CriticalAlert {
  trace_id: string
  audio_url: string
  summary: string
}

export interface Postmortem {
  trace_id: string
  markdown: string
}

/** WebSocket message discriminated union */
export type WsMessage =
  | { type: "trace"; payload: Trace }
  | { type: "critical_alert"; payload: CriticalAlert }
  | { type: "postmortem"; payload: Postmortem }
  | { type: "session_start"; payload: { session_id: string; stadium_id: string; scenario: string } }
