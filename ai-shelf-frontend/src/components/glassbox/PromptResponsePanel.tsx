import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { AgentId } from "@/types/glassbox";

type PromptResponsePanelProps = {
  data: Record<AgentId, { prompt_preview: string; response_preview: string }>;
};

type Tab = AgentId;

function TabButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-xl border px-3 py-2 font-mono text-xs transition-colors",
        active
          ? "border-lavender/25 bg-lavender/10 text-lavender"
          : "border-stroke bg-panel2/55 text-lilac-ash hover:bg-panel2/75"
      )}
    >
      {label}
      {active ? (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-xl shadow-[0_0_45px_rgba(216,216,246,0.08)]"
        />
      ) : null}
    </button>
  );
}

export function PromptResponsePanel({ data }: PromptResponsePanelProps) {
  const [tab, setTab] = useState<Tab>("reasoning");
  const active = useMemo(() => data[tab], [data, tab]);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
          Prompt vs Response
        </div>
        <div className="flex gap-2">
          <TabButton active={tab === "reasoning"} label="Reasoning Agent" onClick={() => setTab("reasoning")} />
          <TabButton active={tab === "fast"} label="Fast Agent" onClick={() => setTab("fast")} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-stroke bg-[#0c0e14]/70 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-lilac-ash">
            Prompt preview
          </div>
          <div className="mt-2 whitespace-pre-wrap font-mono text-sm text-lavender/90">
            {active.prompt_preview}
          </div>
        </div>
        <div className="rounded-2xl border border-stroke bg-[#0c0e14]/70 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-lilac-ash">
            Response preview
          </div>
          <div className="mt-2 whitespace-pre-wrap font-mono text-sm text-lavender/90">
            {active.response_preview}
          </div>
        </div>
      </div>
    </div>
  );
}

