import { cn } from "@/lib/cn";

type MetricsPanelProps = {
  metrics: {
    total_evaluations: number;
    avg_latency_s: number;
    tool_usage_count: number;
    trace_storage_status: string;
    hallucination_risk: "Low" | "Medium" | "High";
    overall_winner: string;
  };
};

function Row({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "ok" | "warn" }) {
  const cls =
    tone === "ok"
      ? "text-ok"
      : tone === "warn"
        ? "text-warning"
        : "text-lavender";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-stroke bg-panel2/45 px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.18em] text-lilac-ash">{label}</div>
      <div className={cn("font-mono text-sm", cls)}>{value}</div>
    </div>
  );
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const riskTone = metrics.hallucination_risk === "Low" ? "ok" : metrics.hallucination_risk === "Medium" ? "warn" : "warn";
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">Query Metrics</div>
      <div className="mt-3 space-y-2">
        <Row label="Total evaluations" value={metrics.total_evaluations.toLocaleString()} />
        <Row label="Avg latency" value={`${metrics.avg_latency_s.toFixed(1)}s`} />
        <Row label="Tool usage count" value={`${metrics.tool_usage_count}`} />
        <Row label="Trace storage" value={metrics.trace_storage_status} />
        <Row label="Hallucination risk" value={metrics.hallucination_risk} tone={riskTone} />
        <Row label="Overall winner" value={metrics.overall_winner} />
      </div>
    </div>
  );
}

