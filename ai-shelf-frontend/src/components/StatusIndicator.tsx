import { cn } from "@/lib/cn";

type StatusTone = "ok" | "warning" | "danger" | "off";

type StatusIndicatorProps = {
  label: string;
  value: string;
  tone: StatusTone;
};

const dot: Record<StatusTone, string> = {
  ok: "bg-ok shadow-[0_0_18px_rgba(46,229,157,0.55)]",
  warning: "bg-warning shadow-[0_0_18px_rgba(255,176,32,0.55)]",
  danger: "bg-danger shadow-[0_0_18px_rgba(255,59,92,0.55)]",
  off: "bg-charcoal shadow-none"
};

export function StatusIndicator({ label, value, tone }: StatusIndicatorProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-stroke bg-panel2/70 px-3 py-2">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.18em] text-lilac-ash">
          {label}
        </div>
        <div className="truncate font-mono text-sm text-lavender">{value}</div>
      </div>
      <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dot[tone])} />
    </div>
  );
}

