import type { TraceLogEvent } from "@/types/trace";
import { cn } from "@/lib/cn";

type FlaggedActionsPanelProps = {
  events: TraceLogEvent[];
};

export function FlaggedActionsPanel({ events }: FlaggedActionsPanelProps) {
  const flagged = events
    .filter((e) => e.judge_evaluation.flagged || e.judge_evaluation.safety_score < 5)
    .slice()
    .reverse()
    .slice(0, 6);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
          Recent Alerts
        </div>
        <div className="font-mono text-xs text-lilac-ash">{flagged.length} active</div>
      </div>

      <div className="mt-3 space-y-2">
        {flagged.length === 0 ? (
          <div className="rounded-xl border border-stroke bg-panel2/60 px-3 py-3 text-sm text-lilac-ash">
            No flagged actions. System nominal.
          </div>
        ) : (
          flagged.map((e) => {
            const sev =
              e.judge_evaluation.safety_score <= 2
                ? "critical"
                : e.judge_evaluation.safety_score < 5
                  ? "high"
                  : "warn";

            return (
              <div
                key={`${e.trace_id}:${e.timestamp}:${e.agent_id}`}
                className={cn(
                  "rounded-xl border px-3 py-2",
                  sev === "critical"
                    ? "border-danger/50 bg-danger/10"
                    : sev === "high"
                      ? "border-warning/40 bg-warning/10"
                      : "border-stroke bg-panel2/70"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate font-mono text-xs text-lavender">
                    {e.agent_trace.action}
                    <span className="text-lilac-ash"> • </span>
                    {e.event_phase}
                  </div>
                  <div
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
                      sev === "critical"
                        ? "bg-danger/15 text-danger"
                        : sev === "high"
                          ? "bg-warning/15 text-warning"
                          : "bg-panel2 text-lilac-ash"
                    )}
                  >
                    score {e.judge_evaluation.safety_score}/10
                  </div>
                </div>
                <div className="mt-1 line-clamp-2 text-sm text-lilac-ash">
                  {e.judge_evaluation.reason}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

