import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { AwsContextChip } from "@/types/glassbox";

type HeaderBarProps = {
  title: string;
  subtitle: string;
  status: "Ready" | "Running";
  queryId: string;
  auditVersion: string;
  aws: AwsContextChip[];
  onRun: () => void;
  onRefresh: () => void;
};

function Chip({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "ok" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] leading-none",
        tone === "ok"
          ? "border-ok/30 bg-ok/10 text-ok"
          : "border-stroke bg-panel2/60 text-lilac-ash"
      )}
    >
      {label}
    </span>
  );
}

export function HeaderBar({
  title,
  subtitle,
  status,
  queryId,
  auditVersion,
  aws,
  onRun,
  onRefresh
}: HeaderBarProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.28em] text-lilac-ash">
          {title}
        </div>
        <div className="mt-2 text-2xl font-semibold text-lavender">
          AI Agent Observability Dashboard
        </div>
        <div className="mt-1 text-sm text-lilac-ash">{subtitle}</div>

        <div className="mt-3 flex flex-wrap gap-2">
          {aws.map((a) => (
            <span
              key={a}
              className="rounded-full border border-stroke bg-panel2/40 px-2.5 py-1 text-[11px] text-lilac-ash"
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip label={`Status: ${status}`} tone={status === "Ready" ? "ok" : "neutral"} />
          <Chip label={`Query ID: ${queryId}`} />
          <Chip label={`Audit: ${auditVersion}`} />
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <motion.button
            onClick={onRun}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border border-lavender/20 bg-lavender/10 px-3 py-2 text-sm font-medium text-lavender shadow-[0_0_0_1px_rgba(216,216,246,0.10)] hover:bg-lavender/15"
          >
            Run Evaluation
          </motion.button>
          <motion.button
            onClick={onRefresh}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border border-stroke bg-panel2/60 px-3 py-2 text-sm font-medium text-lilac-ash hover:bg-panel2/80"
          >
            Refresh
          </motion.button>
        </div>
      </div>
    </div>
  );
}

