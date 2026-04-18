import type { TraceLogEvent } from "@/types/trace";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type LiveTraceTerminalProps = {
  events: TraceLogEvent[];
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function useTypewriter(text: string, speedMs = 10) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = window.setInterval(() => {
      setN((prev) => {
        if (prev >= text.length) return prev;
        return prev + 1;
      });
    }, speedMs);
    return () => window.clearInterval(id);
  }, [speedMs, text]);
  return text.slice(0, n);
}

export function LiveTraceTerminal({ events }: LiveTraceTerminalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sorted = useMemo(
    () => events.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [events]
  );
  const latest = sorted[sorted.length - 1];
  const typedThought = useTypewriter(latest?.agent_trace.thought ?? "", 9);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [sorted.length, typedThought.length]);

  return (
    <div className="glass relative h-[72vh] rounded-2xl p-4">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[image:var(--terminal-grid)] opacity-0" />
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
          Live Trace Terminal
        </div>
        <div className="font-mono text-xs text-lilac-ash">
          {latest ? `${latest.event_phase} • ${fmtTime(latest.timestamp)}` : "Waiting…"}
        </div>
      </div>

      <div
        ref={containerRef}
        className="mt-3 h-[calc(72vh-3.5rem)] overflow-auto rounded-xl border border-stroke bg-[#070710]/70 p-3 shadow-[inset_0_0_0_1px_rgba(216,216,246,0.06)]"
      >
        <div className="pointer-events-none sticky top-0 z-10 -mx-3 -mt-3 h-10 bg-gradient-to-b from-[#070710] to-transparent" />

        <div className="space-y-3 font-mono text-sm leading-relaxed">
          {sorted.map((e, idx) => {
            const isLatest = idx === sorted.length - 1;
            const thought = isLatest ? typedThought : e.agent_trace.thought;
            return (
              <motion.div
                key={`${e.trace_id}:${e.timestamp}:${e.agent_id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-stroke bg-panel2/30 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-lilac-ash">
                    <span className="uppercase tracking-[0.18em]">agent</span>{" "}
                    <span className="text-lavender">{e.agent_id}</span>
                  </div>
                  <div className="text-xs text-lilac-ash">{fmtTime(e.timestamp)}</div>
                </div>

                <div className="mt-2 grid gap-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-amethyst-smoke">
                      [OBSERVATION]
                    </div>
                    <div className="text-lavender/90">{e.agent_trace.observation}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-amethyst-smoke">
                      [THOUGHT]
                    </div>
                    <div className="text-lavender/90">
                      {thought}
                      {isLatest ? (
                        <span className={cn("ml-1 inline-block h-4 w-2 align-middle bg-lavender/70", "animate-caret")} />
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-amethyst-smoke">
                      [ACTION]
                    </div>
                    <div className="text-lavender/90">
                      <span className="text-lavender">{e.agent_trace.action}</span>
                      <span className="text-lilac-ash">{"  "}</span>
                      <span className="text-lilac-ash">
                        {JSON.stringify(e.agent_trace.action_input)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

