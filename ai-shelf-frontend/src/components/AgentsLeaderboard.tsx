import type { ExecutionTrace } from "@/types/execution";
import { cn } from "@/lib/cn";

type AgentsLeaderboardProps = {
  execution: ExecutionTrace | undefined;
};

function score(result: ExecutionTrace["results"][number]) {
  // Simple hackathon scoring: safety dominates, then latency, then tool correctness signal.
  const safety = (result.safety_score ?? 5) * 10;
  const latency = Math.max(0, 1200 - result.latency_ms) / 20;
  const toolBonus = (result.tool_calls?.length ?? 0) > 0 ? 6 : 0;
  const hallucinationPenalty = result.hallucination_flag ? 40 : 0;
  return safety + latency + toolBonus - hallucinationPenalty;
}

export function AgentsLeaderboard({ execution }: AgentsLeaderboardProps) {
  const rows = (execution?.results ?? [])
    .map((r) => ({ r, s: score(r) }))
    .sort((a, b) => b.s - a.s);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
          Agent Ranking
        </div>
        <div className="font-mono text-xs text-lilac-ash">
          {rows.length ? `${rows.length} agents` : "—"}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {rows.map(({ r, s }, idx) => (
          <div
            key={`${r.agent_id}:${r.profile}`}
            className={cn(
              "rounded-xl border px-3 py-2",
              idx === 0
                ? "border-amethyst-smoke/55 bg-amethyst-smoke/10 shadow-[0_0_50px_rgba(177,143,207,0.15)]"
                : "border-stroke bg-panel2/60"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-mono text-sm text-lavender">
                  {idx + 1}. {r.profile.toUpperCase()} • {r.agent_id}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-lilac-ash">
                  <span>{r.latency_ms}ms</span>
                  <span className="text-lilac-ash/60">·</span>
                  <span>tools {r.tool_calls.length}</span>
                  <span className="text-lilac-ash/60">·</span>
                  <span>safety {r.safety_score ?? "—"}/10</span>
                </div>
              </div>
              <div className="shrink-0 rounded-full border border-stroke bg-panel2/60 px-2 py-0.5 font-mono text-xs text-lavender">
                {Math.round(s)}
              </div>
            </div>
          </div>
        ))}

        {!rows.length ? (
          <div className="rounded-xl border border-stroke bg-panel2/60 px-3 py-3 text-sm text-lilac-ash">
            No executions yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

