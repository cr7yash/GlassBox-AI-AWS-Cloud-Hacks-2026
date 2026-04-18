import type { AgentResult, ExecutionTrace } from "@/types/execution";
import { cn } from "@/lib/cn";

type ExecutionTraceViewerProps = {
  execution: ExecutionTrace | undefined;
  selected: AgentResult | undefined;
  onSelect: (r: AgentResult) => void;
};

export function ExecutionTraceViewer({
  execution,
  selected,
  onSelect
}: ExecutionTraceViewerProps) {
  const results = execution?.results ?? [];

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
          Execution Traces
        </div>
        <div className="font-mono text-xs text-lilac-ash">
          {execution ? execution.execution_id : "—"}
        </div>
      </div>

      {execution ? (
        <div className="mt-3 rounded-xl border border-stroke bg-panel2/40 p-3">
          <div className="text-xs uppercase tracking-[0.18em] text-amethyst-smoke">
            User query
          </div>
          <div className="mt-1 text-sm text-lavender/90">{execution.user_query}</div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {results.map((r) => {
          const isSel = selected?.agent_id === r.agent_id && selected?.profile === r.profile;
          const flagged = r.hallucination_flag || (r.safety_score ?? 10) < 5;
          return (
            <button
              key={`${r.agent_id}:${r.profile}`}
              onClick={() => onSelect(r)}
              className={cn(
                "text-left rounded-xl border px-3 py-2 transition-colors",
                isSel
                  ? "border-lavender/40 bg-lavender/5"
                  : "border-stroke bg-panel2/60 hover:bg-panel2/80",
                flagged ? "shadow-[0_0_0_1px_rgba(255,59,92,0.10)]" : ""
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-mono text-sm text-lavender">
                  {r.profile.toUpperCase()}
                </div>
                {flagged ? (
                  <span className="rounded-full bg-danger/15 px-2 py-0.5 font-mono text-xs text-danger">
                    flagged
                  </span>
                ) : (
                  <span className="rounded-full bg-ok/15 px-2 py-0.5 font-mono text-xs text-ok">
                    ok
                  </span>
                )}
              </div>
              <div className="mt-1 font-mono text-xs text-lilac-ash">
                {r.agent_id} • {r.latency_ms}ms • tools {r.tool_calls.length}
              </div>
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="mt-3 space-y-2">
          <div className="rounded-xl border border-stroke bg-[#070710]/70 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-amethyst-smoke">
              Prompt
            </div>
            <div className="mt-1 font-mono text-sm text-lavender/90">{selected.prompt}</div>
          </div>

          <div className="rounded-xl border border-stroke bg-[#070710]/70 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-amethyst-smoke">
              Response
            </div>
            <div className="mt-1 whitespace-pre-wrap font-mono text-sm text-lavender/90">
              {selected.response}
            </div>
          </div>

          <div className="rounded-xl border border-stroke bg-panel2/50 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-amethyst-smoke">
              Tool usage
            </div>
            <div className="mt-2 space-y-2">
              {selected.tool_calls.length === 0 ? (
                <div className="font-mono text-xs text-lilac-ash">No tool calls</div>
              ) : (
                selected.tool_calls.map((t, i) => (
                  <div
                    key={`${t.tool_name}:${i}`}
                    className="rounded-lg border border-stroke bg-panel2/60 px-2 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-xs text-lavender">{t.tool_name}</div>
                      <div className="font-mono text-xs text-lilac-ash">
                        {t.latency_ms ?? "—"}ms
                      </div>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-lilac-ash">
                      in: {JSON.stringify(t.input)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

