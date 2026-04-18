"use client";

import { useMemo, useState } from "react";
import { glassboxMock } from "@/data/glassboxMock";
import { HeaderBar } from "@/components/glassbox/HeaderBar";
import { PipelineFlow } from "@/components/glassbox/PipelineFlow";
import { AgentCard } from "@/components/glassbox/AgentCard";
import { ExecutionTraceTable } from "@/components/glassbox/ExecutionTraceTable";
import { RankingPanel } from "@/components/glassbox/RankingPanel";
import { PromptResponsePanel } from "@/components/glassbox/PromptResponsePanel";
import { MetricsPanel } from "@/components/glassbox/MetricsPanel";
import { ChartsSection } from "@/components/glassbox/ChartsSection";
import { ControlFooter } from "@/components/glassbox/ControlFooter";
import { ThreeBackdropDynamic } from "@/components/ThreeBackdrop.dynamic";

export default function DashboardPage() {
  const [toast, setToast] = useState<string | null>(null);
  const data = glassboxMock;

  const winnerId = data.ranking.winner;
  const winnerName = data.agents.find((a) => a.id === winnerId)?.name ?? "—";

  const rankingRows = useMemo(
    () =>
      data.agents
        .slice()
        .sort((a, b) => a.rank - b.rank)
        .map((a) => {
          const score = data.ranking.scores.find((s) => s.agent === a.id)?.score ?? 0;
          return { name: a.name, score, rank: a.rank };
        }),
    [data]
  );

  return (
    <main className="min-h-screen bg-shell">
      <ThreeBackdropDynamic />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-radial-glow" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-glass-grid [background-size:48px_48px] opacity-60" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="noise" />
        <div className="vignette" />
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <HeaderBar
          title={data.query.title}
          subtitle={data.query.subtitle}
          status={data.query.status}
          queryId={data.query.query_id}
          auditVersion={data.query.audit_version}
          aws={data.query.aws}
          onRun={() => setToast(`Queued evaluation run. Current winner: ${winnerName}`)}
          onRefresh={() => setToast("Refreshing mock data (UI only)…")}
        />

        <div className="mt-5">
          <PipelineFlow />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.agents
            .slice()
            .sort((a, b) => a.rank - b.rank)
            .map((a) => (
              <AgentCard key={a.id} agent={a} winner={a.id === winnerId} />
            ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <ExecutionTraceTable rows={data.trace_entries} />
          </section>
          <section className="lg:col-span-4 space-y-4">
            <RankingPanel ranking={rankingRows} weights={data.ranking.weights} />
            <MetricsPanel
              metrics={{
                ...data.metrics,
                overall_winner: winnerName
              }}
            />
          </section>

          <section className="lg:col-span-12">
            <PromptResponsePanel data={data.prompt_response} />
          </section>
        </div>

        <div className="mt-5">
          <ChartsSection
            accuracy={data.charts.accuracy}
            latency={data.charts.latency}
            toolsTrace={data.charts.tools_trace}
          />
        </div>

        <ControlFooter
          onRun={({ queryType, mode }) =>
            setToast(`Run Simulation Step: ${queryType} • ${mode} • agents=2 • winner=${winnerName}`)
          }
        />

        {toast ? (
          <div className="fixed bottom-6 left-1/2 z-50 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2">
            <div className="glass rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-mono text-xs text-lavender">{toast}</div>
                <button
                  className="rounded-xl border border-stroke bg-panel2/60 px-2 py-1 font-mono text-xs text-lilac-ash hover:bg-panel2/80"
                  onClick={() => setToast(null)}
                >
                  close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

