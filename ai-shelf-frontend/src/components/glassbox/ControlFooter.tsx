import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/cn";

type ControlFooterProps = {
  onRun: (params: { queryType: string; mode: string }) => void;
};

const queryTypes = ["General QA", "Gardening", "Tool Use", "RAG Test"] as const;
const modes = ["Normal Audit", "Stress Test", "Chaos Mode"] as const;

function Select({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="min-w-[180px]">
      <div className="text-[10px] uppercase tracking-[0.18em] text-lilac-ash">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "mt-1 w-full rounded-xl border border-stroke bg-panel2/60 px-3 py-2 text-sm text-lavender",
          "focus:outline-none focus:ring-2 focus:ring-lavender/15"
        )}
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-bg2">
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ControlFooter({ onRun }: ControlFooterProps) {
  const [queryType, setQueryType] = useState<(typeof queryTypes)[number]>("Gardening");
  const [mode, setMode] = useState<(typeof modes)[number]>("Normal Audit");

  return (
    <div className="glass sticky bottom-4 mt-6 rounded-2xl p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Select label="Query Type" value={queryType} onChange={(v) => setQueryType(v)} options={queryTypes} />
          <Select label="Execution Mode" value={mode} onChange={(v) => setMode(v)} options={modes} />
          <div className="min-w-[160px]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-lilac-ash">Agent Count</div>
            <div className="mt-1 rounded-xl border border-stroke bg-panel2/60 px-3 py-2 font-mono text-sm text-lavender">
              2
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onRun({ queryType, mode })}
          className="rounded-2xl border border-lavender/20 bg-lavender/10 px-5 py-3 text-sm font-semibold text-lavender shadow-[0_0_0_1px_rgba(216,216,246,0.12),0_0_55px_rgba(216,216,246,0.08)] hover:bg-lavender/15"
        >
          Run Simulation Step
        </motion.button>
      </div>
    </div>
  );
}

