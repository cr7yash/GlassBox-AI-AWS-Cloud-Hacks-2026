import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Node = {
  label: string;
  tone?: "active" | "neutral";
};

const nodes: Node[] = [
  { label: "User Query", tone: "active" },
  { label: "Step Functions", tone: "active" },
  { label: "Reasoning Agent", tone: "active" },
  { label: "Fast Agent", tone: "active" },
  { label: "Judge", tone: "neutral" },
  { label: "Dashboard", tone: "active" }
];

function Dot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-full border",
        active
          ? "border-lavender/30 bg-lavender/10 shadow-[0_0_0_1px_rgba(216,216,246,0.10),0_0_30px_rgba(216,216,246,0.10)]"
          : "border-stroke bg-panel2/60"
      )}
    >
      {active ? (
        <span className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(216,216,246,0.12)]" />
      ) : null}
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-lavender" : "bg-lilac-ash")} />
    </span>
  );
}

export function PipelineFlow() {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
        Orchestration Pipeline
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {nodes.map((n, i) => {
          const active = n.tone === "active";
          return (
            <div key={n.label} className="flex items-center gap-3">
              <motion.div
                whileHover={{ y: -2 }}
                className="flex items-center gap-3"
              >
                <Dot active={active} />
                <div className="min-w-[140px]">
                  <div className="text-sm font-medium text-lavender">{n.label}</div>
                  <div className="text-xs text-lilac-ash">
                    {active ? "active" : "idle"}
                  </div>
                </div>
              </motion.div>
              {i < nodes.length - 1 ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="h-px w-10 bg-gradient-to-r from-stroke to-transparent" />
                  <div className="h-1 w-1 rounded-full bg-stroke" />
                  <div className="h-px w-10 bg-gradient-to-r from-transparent to-stroke" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

