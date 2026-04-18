export type AwsContextChip =
  | "Bedrock"
  | "Step Functions"
  | "Lambda"
  | "DynamoDB"
  | "S3";

export type AgentId = "reasoning" | "fast";

export type AgentSummary = {
  id: AgentId;
  name: string;
  status: "Ready" | "Running" | "Degraded";
  rank: 1 | 2;
  accuracy_pct: number;
  latency_s: number;
  tool_calls: number;
  trace_depth: number;
  confidence: number; // 0..1
};

export type TraceTool = "Calculator" | "Retrieval" | "None";

export type ExecutionTraceEntry = {
  agent: AgentId;
  prompt_style: string;
  response_summary: string;
  tools: TraceTool[];
  latency_s: number;
  trace_id: string;
};

export type RankingWeights = {
  accuracy_weight: number;
  latency_weight: number;
  tool_success_weight: number;
  hallucination_penalty: number;
};

export type ChartRow = {
  label: string;
  reasoning: number;
  fast: number;
};

export type GlassBoxMock = {
  query: {
    status: "Ready" | "Running";
    query_id: string;
    audit_version: string;
    title: string;
    subtitle: string;
    aws: AwsContextChip[];
  };
  agents: AgentSummary[];
  trace_entries: ExecutionTraceEntry[];
  ranking: {
    weights: RankingWeights;
    scores: Array<{ agent: AgentId; score: number }>;
    winner: AgentId;
  };
  prompt_response: Record<
    AgentId,
    { prompt_preview: string; response_preview: string }
  >;
  metrics: {
    total_evaluations: number;
    avg_latency_s: number;
    tool_usage_count: number;
    trace_storage_status: "S3 + DynamoDB synced" | "Pending";
    hallucination_risk: "Low" | "Medium" | "High";
    overall_winner: string;
  };
  charts: {
    accuracy: ChartRow[];
    latency: ChartRow[];
    tools_trace: Array<{
      label: string;
      reasoning_tools: number;
      fast_tools: number;
      reasoning_trace_depth: number;
      fast_trace_depth: number;
    }>;
  };
};

