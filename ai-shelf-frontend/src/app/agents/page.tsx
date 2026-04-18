"use client";

import { useMemo, useState } from "react";
import { useExecutionPolling } from "@/hooks/useExecutionPolling";
import { AgentsLeaderboard } from "@/components/AgentsLeaderboard";
import { ExecutionTraceViewer } from "@/components/ExecutionTraceViewer";
import type { AgentResult } from "@/types/execution";

export default function AgentsPage() {
  const { executions, isLoading, error, lastUpdatedAt } = useExecutionPolling({
    mode: "mock",
    intervalMs: 2000
  });

  const latest = executions[0];
  const [selected, setSelected] = useState<AgentResult | undefined>(latest?.results?.[0]);

  const headerStatus = useMemo(() => {
    if (isLoading) return "loading…";
    if (error) return "error";
    return "live";
  }, [error, isLoading]);

  return (
    <main className="min-h-screen bg-bg">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-radial-glow" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-glass-grid [background-size:48px_48px] opacity-60" />

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-lilac-ash">
              Project GlassBox AI
            </div>
            <div className="mt-2 text-2xl font-semibold text-lavender">
              Multi‑Agent Observability
            </div>
            <div className="mt-1 text-sm text-lilac-ash">
              Prompts • Responses • Tool usage • Latency • Ranking • Traces
            </div>
          </div>

          <div className="glass rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3 font-mono text-xs text-lilac-ash">
              <span>{headerStatus}</span>
              {lastUpdatedAt ? (
                <span className="text-lilac-ash/70">
                  · {new Date(lastUpdatedAt).toLocaleTimeString()}
                </span>
              ) : null}
            </div>
            {error ? (
              <div className="mt-1 font-mono text-xs text-danger">{error}</div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <section className="lg:col-span-4">
            <AgentsLeaderboard execution={latest} />
          </section>
          <section className="lg:col-span-8">
            <ExecutionTraceViewer
              execution={latest}
              selected={selected}
              onSelect={(r) => setSelected(r)}
            />
          </section>
        </div>

        <div className="mt-6 glass rounded-2xl p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
            AWS flow (wiring-ready)
          </div>
          <div className="mt-2 text-sm text-lilac-ash">
            User query → API Gateway → Step Functions (Map/Parallel) → Lambda (agents via Bedrock) → DynamoDB/S3 →
            ranking → UI polling.
          </div>
          <div className="mt-2 font-mono text-xs text-lilac-ash">
            Live mode placeholder: set <span className="text-lavender">NEXT_PUBLIC_LOGS_BASE_URL</span> and expose{" "}
            <span className="text-lavender">GET /executions</span>.
          </div>
        </div>
      </div>
    </main>
  );
}

