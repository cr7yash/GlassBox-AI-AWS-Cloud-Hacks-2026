import type { GlassBoxMock } from "@/types/glassbox";

export const glassboxMock: GlassBoxMock = {
  query: {
    status: "Ready",
    query_id: "eval-2031",
    audit_version: "v3.1.2-beta",
    title: "GlassBox AI",
    subtitle: "2-Agent Evaluation Audit",
    aws: ["Bedrock", "Step Functions", "Lambda", "DynamoDB", "S3"]
  },
  agents: [
    {
      id: "reasoning",
      name: "Reasoning Agent",
      status: "Ready",
      rank: 1,
      accuracy_pct: 92,
      latency_s: 2.4,
      tool_calls: 3,
      trace_depth: 8,
      confidence: 0.91
    },
    {
      id: "fast",
      name: "Fast Agent",
      status: "Ready",
      rank: 2,
      accuracy_pct: 81,
      latency_s: 1.1,
      tool_calls: 0,
      trace_depth: 3,
      confidence: 0.79
    }
  ],
  trace_entries: [
    {
      agent: "reasoning",
      prompt_style: "Solve step-by-step",
      response_summary: "Balcony vegetable layout with spacing, sun exposure, and watering schedule.",
      tools: ["Calculator", "Retrieval"],
      latency_s: 2.4,
      trace_id: "trace-r-8f2a"
    },
    {
      agent: "fast",
      prompt_style: "Direct short answer",
      response_summary: "Quick layout suggestion + 3 key tips for balcony veggies.",
      tools: ["None"],
      latency_s: 1.1,
      trace_id: "trace-f-13c9"
    }
  ],
  ranking: {
    weights: {
      accuracy_weight: 0.55,
      latency_weight: 0.25,
      tool_success_weight: 0.15,
      hallucination_penalty: 0.05
    },
    scores: [
      { agent: "reasoning", score: 86.4 },
      { agent: "fast", score: 74.9 }
    ],
    winner: "reasoning"
  },
  prompt_response: {
    reasoning: {
      prompt_preview:
        "You are a careful reasoning agent. Solve step-by-step. Provide an actionable balcony vegetable layout with constraints (sun hours, container size, watering).",
      response_preview:
        "1) Constraints: 4–6h sun, 6 containers. 2) Layout: tall plants north edge, herbs front. 3) Watering: morning drip + mulch. 4) Weekly checklist..."
    },
    fast: {
      prompt_preview:
        "You are a fast agent. Give a short, direct balcony vegetable layout with minimal reasoning.",
      response_preview:
        "Put tomatoes/peppers at the back, leafy greens front. Use 10–15L pots, water daily in heat, rotate every week."
    }
  },
  metrics: {
    total_evaluations: 128,
    avg_latency_s: 1.7,
    tool_usage_count: 3,
    trace_storage_status: "S3 + DynamoDB synced",
    hallucination_risk: "Low",
    overall_winner: "Reasoning Agent"
  },
  charts: {
    accuracy: [
      { label: "Accuracy", reasoning: 92, fast: 81 }
    ],
    latency: [
      { label: "Latency (s)", reasoning: 2.4, fast: 1.1 }
    ],
    tools_trace: [
      {
        label: "Tools / Trace Depth",
        reasoning_tools: 3,
        fast_tools: 0,
        reasoning_trace_depth: 8,
        fast_trace_depth: 3
      }
    ]
  }
};

