import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { AgentSummary } from "@/types/glassbox";

type AgentCardProps = {
  agent: AgentSummary;
  winner?: boolean;
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stroke bg-panel2/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-lilac-ash">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm text-lavender">{value}</div>
    </div>
  );
}

export function AgentCard({ agent, winner = false }: AgentCardProps) {
  const statusTone =
    agent.status === "Ready" ? "bg-ok/12 text-ok border-ok/25" : "bg-warning/12 text-warning border-warning/25";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -2 }}
      className={cn(
        "glass relative overflow-hidden rounded-2xl p-4",
        winner
          ? "shadow-[0_0_0_1px_rgba(216,216,246,0.16),0_0_55px_rgba(216,216,246,0.10)]"
          : ""
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 hover:opacity-100">
        <div className="absolute -left-1/3 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-glow to-transparent animate-shimmer" />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-lavender/20 bg-lavender/10 px-2 py-0.5 font-mono text-xs text-lavender">
              #{agent.rank}
            </div>
            <div className={cn("rounded-full border px-2 py-0.5 font-mono text-xs", statusTone)}>
              {agent.status}
            </div>
          </div>
          <div className="mt-2 text-lg font-semibold text-lavender">{agent.name}</div>
          <div className="mt-1 font-mono text-xs text-lilac-ash">
            id: {agent.id}
          </div>
        </div>

        {winner ? (
          <div className="rounded-full border border-lavender/20 bg-lavender/10 px-2 py-1 font-mono text-xs text-lavender">
            winner
          </div>
        ) : null}
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <Metric label="Accuracy" value={`${agent.accuracy_pct}%`} />
        <Metric label="Latency" value={`${agent.latency_s.toFixed(1)}s`} />
        <Metric label="Tool Calls" value={`${agent.tool_calls}`} />
        <Metric label="Trace Depth" value={`${agent.trace_depth}`} />
        <Metric label="Confidence" value={agent.confidence.toFixed(2)} />
        <Metric label="Status" value={agent.status} />
      </div>
    </motion.div>
  );
}

