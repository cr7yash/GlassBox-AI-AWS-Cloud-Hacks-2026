export type FacilityState = {
  outside_temp_f: number;
  attendance: number;
  grid_cost_kwh: number;
};

export type AgentTrace = {
  observation: string;
  thought: string;
  action: string;
  action_input: Record<string, unknown>;
};

export type JudgeEvaluation = {
  safety_score: number;
  flagged: boolean;
  reason: string;
};

export type TraceLogEvent = {
  trace_id: string;
  timestamp: string; // ISO string
  agent_id: "manager_agent_01" | "chatgpt" | "claude" | string;
  event_phase: string;
  facility_state: FacilityState;
  agent_trace: AgentTrace;
  judge_evaluation: JudgeEvaluation;
};

