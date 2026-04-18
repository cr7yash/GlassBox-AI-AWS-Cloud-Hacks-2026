import { cn } from "@/lib/cn";

type RadialGaugeProps = {
  label: string;
  value: number; // 0..1
  centerText: string;
  tone?: "ok" | "warning" | "danger" | "neutral";
};

const toneColor: Record<NonNullable<RadialGaugeProps["tone"]>, string> = {
  ok: "#2ee59d",
  warning: "#ffb020",
  danger: "#ff3b5c",
  neutral: "#d8d8f6"
};

export function RadialGauge({ label, value, centerText, tone = "neutral" }: RadialGaugeProps) {
  const v = Math.max(0, Math.min(1, value));
  const r = 44;
  const c = 2 * Math.PI * r;
  const dash = c * v;
  const color = toneColor[tone];

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">{label}</div>
      <div className="mt-3 flex items-center gap-4">
        <svg width="112" height="112" viewBox="0 0 112 112" className="shrink-0">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#b18fcf" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#d8d8f6" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <circle cx="56" cy="56" r={r} stroke="rgba(216,216,246,0.12)" strokeWidth="10" fill="none" />
          <circle
            cx="56"
            cy="56"
            r={r}
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform="rotate(-90 56 56)"
            style={{ filter: `drop-shadow(0 0 14px ${color}55)` }}
          />
          <circle cx="56" cy="56" r="29" fill="url(#g)" fillOpacity="0.10" />
          <circle cx="56" cy="56" r="29" stroke="rgba(216,216,246,0.12)" strokeWidth="1" fill="none" />
          <text x="56" y="61" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" fontSize="14" fill="#d8d8f6">
            {centerText}
          </text>
        </svg>

        <div className="min-w-0">
          <div className={cn("font-mono text-sm text-lavender")}>
            Operational envelope
          </div>
          <div className="mt-1 text-xs text-lilac-ash">
            Animated gauge for “control room” feel (swap with real telemetry later).
          </div>
        </div>
      </div>
    </div>
  );
}

