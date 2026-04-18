import { cn } from "@/lib/cn";
import type { RankingWeights } from "@/types/glassbox";

type RankingPanelProps = {
  ranking: Array<{ name: string; score: number; rank: 1 | 2 }>;
  weights: RankingWeights;
};

export function RankingPanel({ ranking, weights }: RankingPanelProps) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
          Ranking
        </div>
        <div className="font-mono text-xs text-lilac-ash">formula</div>
      </div>

      <div className="mt-3 space-y-2">
        {ranking.map((r) => (
          <div
            key={r.name}
            className={cn(
              "rounded-xl border px-3 py-2",
              r.rank === 1
                ? "border-lavender/25 bg-lavender/8 shadow-[0_0_40px_rgba(216,216,246,0.08)]"
                : "border-stroke bg-panel2/55"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-sm text-lavender">
                #{r.rank} {r.name}
              </div>
              <div className="rounded-full border border-stroke bg-panel2/60 px-2 py-0.5 font-mono text-xs text-lavender">
                {r.score.toFixed(1)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-stroke bg-panel2/35 p-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-lilac-ash">
          Weight breakdown
        </div>
        <div className="mt-2 space-y-1.5 font-mono text-xs text-lilac-ash">
          <div className="flex items-center justify-between">
            <span>Accuracy</span>
            <span className="text-lavender">{weights.accuracy_weight}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Latency</span>
            <span className="text-lavender">{weights.latency_weight}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Tool success</span>
            <span className="text-lavender">{weights.tool_success_weight}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Hallucination penalty</span>
            <span className="text-lavender">{weights.hallucination_penalty}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

