import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ExecutionTraceEntry, TraceTool } from "@/types/glassbox";

type ExecutionTraceTableProps = {
  rows: ExecutionTraceEntry[];
};

function toolTone(t: TraceTool) {
  if (t === "None") return "border-stroke bg-panel2/60 text-lilac-ash";
  if (t === "Calculator") return "border-lavender/20 bg-lavender/10 text-lavender";
  return "border-amethyst-smoke/20 bg-amethyst-smoke/10 text-amethyst-smoke";
}

export function ExecutionTraceTable({ rows }: ExecutionTraceTableProps) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
          Execution Trace
        </div>
        <div className="font-mono text-xs text-lilac-ash">{rows.length} entries</div>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-stroke bg-panel2/35">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead className="bg-panel2/60">
            <tr className="text-[11px] uppercase tracking-[0.18em] text-lilac-ash">
              <th className="px-3 py-3">Agent</th>
              <th className="px-3 py-3">Prompt style</th>
              <th className="px-3 py-3">Response summary</th>
              <th className="px-3 py-3">Tools</th>
              <th className="px-3 py-3">Latency</th>
              <th className="px-3 py-3">Trace ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <motion.tr
                key={`${r.agent}:${r.trace_id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: idx * 0.03 }}
                className="border-t border-stroke/70"
              >
                <td className="px-3 py-3 font-mono text-lavender">{r.agent}</td>
                <td className="px-3 py-3 text-lilac-ash">{r.prompt_style}</td>
                <td className="px-3 py-3 text-lavender/90">{r.response_summary}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {r.tools.map((t) => (
                      <span
                        key={t}
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-mono text-[11px]",
                          toolTone(t)
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-lavender">
                  {r.latency_s.toFixed(1)}s
                </td>
                <td className="px-3 py-3 font-mono text-lilac-ash">{r.trace_id}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

