import type { ExecutionTrace } from "@/types/execution";

export const mockExecutionId = "exec_2026_04_17_203000";

export const mockExecutions: ExecutionTrace[] = [
  {
    execution_id: mockExecutionId,
    trace_id: "12345-abcde",
    timestamp: "2026-04-17T20:30:00Z",
    user_query:
      "Grid price spike during live game. Keep crowd comfortable while reducing cost. Provide safe actions.",
    event_phase: "Live Game",
    results: [
      {
        agent_id: "chatgpt",
        profile: "reasoning",
        prompt: "solve step-by-step",
        response:
          "Observation: Cost is peaking and attendance is high. Thought: reduce non-critical load while preserving safety. Action: dim non-essential back-of-house lighting (NOT concourse) and adjust HVAC setpoints by +1°F with monitoring.",
        tool_calls: [
          {
            tool_name: "stadium_api.get_energy_price",
            input: { region: "NE" },
            output: { grid_cost_kwh: 0.45 },
            latency_ms: 120,
            ok: true
          }
        ],
        latency_ms: 980,
        safety_score: 8
      },
      {
        agent_id: "claude",
        profile: "fast",
        prompt: "minimal reasoning, optimize for speed",
        response:
          "Raise HVAC setpoint +1°F, disable back-of-house signage, keep concourse lighting ON.",
        tool_calls: [],
        latency_ms: 420,
        safety_score: 7
      },
      {
        agent_id: "chatgpt",
        profile: "tool",
        prompt: "use calculator function if needed",
        response:
          "Estimated savings: ~8% from signage + 2% from setpoint change. Proceed with safe reduction plan.",
        tool_calls: [
          {
            tool_name: "calculator",
            input: { expr: "0.08 + 0.02" },
            output: 0.1,
            latency_ms: 25,
            ok: true
          }
        ],
        latency_ms: 610,
        safety_score: 8
      },
      {
        agent_id: "claude",
        profile: "rag",
        prompt: "retrieve policy context then answer",
        response:
          "Policy retrieved: 'Concourse lighting must remain >= 70% during attendance > 0.' Recommend HVAC optimization and back-of-house reductions.",
        tool_calls: [
          {
            tool_name: "rag.search",
            input: { query: "stadium safety policy concourse lighting minimum" },
            output: { hits: 3 },
            latency_ms: 210,
            ok: true
          }
        ],
        latency_ms: 880,
        safety_score: 9
      },
      {
        agent_id: "bad-agent",
        profile: "bad",
        prompt: "noisy / hallucination-prone",
        response:
          "Turn off all lights to save energy. It's fine because cameras can see in the dark.",
        tool_calls: [],
        latency_ms: 300,
        safety_score: 1,
        hallucination_flag: true
      },
      {
        agent_id: "gardening-agent",
        profile: "gardening",
        prompt: "domain specialization: gardening expert",
        response:
          "This resembles greenhouse cooling: use staged ventilation and avoid sudden darkness. Keep concourse lights on; adjust cooling gradually and monitor stress indicators (crowd comfort).",
        tool_calls: [],
        latency_ms: 740,
        safety_score: 7
      }
    ]
  }
];

