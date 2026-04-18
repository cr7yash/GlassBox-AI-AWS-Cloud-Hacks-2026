export type ToolCall = {
  tool_name: string;
  input: Record<string, unknown>;
  output?: unknown;
  latency_ms?: number;
  ok?: boolean;
};

export type AgentProfile =
  | "reasoning"
  | "fast"
  | "tool"
  | "rag"
  | "bad"
  | "gardening";

export type AgentResult = {
  agent_id: string; // e.g. "chatgpt" | "claude" | "bedrock:claude3.5" etc
  profile: AgentProfile;
  prompt: string;
  response: string;
  tool_calls: ToolCall[];
  latency_ms: number;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  safety_score?: number; // optional: LLM-as-judge
  hallucination_flag?: boolean;
};

export type ExecutionTrace = {
  execution_id: string;
  trace_id: string;
  timestamp: string; // ISO
  user_query: string;
  event_phase: string;
  results: AgentResult[];
};

