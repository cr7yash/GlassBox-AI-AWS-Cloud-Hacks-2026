import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { cn } from "@/lib/cn";

type ChartsSectionProps = {
  accuracy: Array<{ label: string; reasoning: number; fast: number }>;
  latency: Array<{ label: string; reasoning: number; fast: number }>;
  toolsTrace: Array<{
    label: string;
    reasoning_tools: number;
    fast_tools: number;
    reasoning_trace_depth: number;
    fast_trace_depth: number;
  }>;
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">{title}</div>
      <div className="mt-3 h-44">{children}</div>
    </div>
  );
}

function TT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-stroke bg-bg2/90 px-3 py-2 text-xs text-lilac-ash shadow-glass">
      <div className="font-mono text-lavender">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="mt-1 flex items-center justify-between gap-3 font-mono">
          <span className="text-lilac-ash">{p.name}</span>
          <span className="text-lavender">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ChartsSection({ accuracy, latency, toolsTrace }: ChartsSectionProps) {
  const grid = "rgba(216,216,246,0.08)";
  const reasoning = "#d8d8f6";
  const fast = "#978897";
  const accent = "#b18fcf";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="grid grid-cols-1 gap-4 lg:grid-cols-3"
    >
      <Card title="Accuracy Comparison">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={accuracy} barSize={28}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="label" stroke="rgba(216,216,246,0.35)" tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(216,216,246,0.35)" tickLine={false} axisLine={false} />
            <Tooltip content={<TT />} cursor={{ fill: "rgba(216,216,246,0.04)" }} />
            <Bar dataKey="reasoning" name="Reasoning" fill={reasoning} radius={[10, 10, 2, 2]} />
            <Bar dataKey="fast" name="Fast" fill={fast} radius={[10, 10, 2, 2]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Latency Comparison">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={latency} barSize={28}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="label" stroke="rgba(216,216,246,0.35)" tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(216,216,246,0.35)" tickLine={false} axisLine={false} />
            <Tooltip content={<TT />} cursor={{ fill: "rgba(216,216,246,0.04)" }} />
            <Bar dataKey="reasoning" name="Reasoning (s)" fill={accent} radius={[10, 10, 2, 2]} />
            <Bar dataKey="fast" name="Fast (s)" fill={fast} radius={[10, 10, 2, 2]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="glass rounded-2xl p-4">
        <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
          Tool Usage / Trace Depth
        </div>
        <div className="mt-3 space-y-3">
          {toolsTrace.map((r) => (
            <div key={r.label} className="rounded-2xl border border-stroke bg-panel2/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-lavender">{r.label}</div>
                <div className="font-mono text-xs text-lilac-ash">2 agents</div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-stroke bg-bg2/40 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-lilac-ash">Reasoning</div>
                  <div className="mt-1 font-mono text-sm text-lavender">
                    tools {r.reasoning_tools} · depth {r.reasoning_trace_depth}
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-stroke/40">
                    <div
                      className={cn("h-1.5 rounded-full", "bg-lavender/70")}
                      style={{ width: `${Math.min(100, (r.reasoning_trace_depth / 10) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-stroke bg-bg2/40 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-lilac-ash">Fast</div>
                  <div className="mt-1 font-mono text-sm text-lavender">
                    tools {r.fast_tools} · depth {r.fast_trace_depth}
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-stroke/40">
                    <div
                      className={cn("h-1.5 rounded-full", "bg-lilac-ash/70")}
                      style={{ width: `${Math.min(100, (r.fast_trace_depth / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

