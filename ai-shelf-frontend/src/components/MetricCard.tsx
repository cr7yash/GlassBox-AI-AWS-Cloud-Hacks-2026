import { cn } from "@/lib/cn";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "ok" | "warning" | "danger";
};

const toneStyles: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  neutral: "text-lavender",
  ok: "text-ok",
  warning: "text-warning",
  danger: "text-danger"
};

export function MetricCard({ label, value, hint, tone = "neutral" }: MetricCardProps) {
  return (
    <div className={cn("glass relative overflow-hidden rounded-2xl p-4", "group")}>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -left-1/3 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-glow to-transparent animate-shimmer" />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
            {label}
          </div>
          <div className={cn("mt-2 font-mono text-3xl leading-none", toneStyles[tone])}>
            {value}
          </div>
          {hint ? (
            <div className="mt-2 text-xs text-lilac-ash/90">{hint}</div>
          ) : null}
        </div>

        <div className="h-10 w-10 rounded-xl border border-stroke bg-gradient-to-br from-panel2 to-transparent shadow-glow" />
      </div>
    </div>
  );
}

