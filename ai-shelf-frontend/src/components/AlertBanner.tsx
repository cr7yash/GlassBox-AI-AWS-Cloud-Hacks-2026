import { cn } from "@/lib/cn";

type AlertBannerProps = {
  title: string;
  description: string;
  active: boolean;
};

export function AlertBanner({ title, description, active }: AlertBannerProps) {
  return (
    <div
      className={cn(
        "glass relative overflow-hidden rounded-2xl border p-4",
        active
          ? "border-danger/60 bg-[rgba(255,59,92,0.08)] shadow-[0_0_0_1px_rgba(255,59,92,0.18),0_0_80px_rgba(255,59,92,0.18)]"
          : "border-stroke"
      )}
    >
      {active ? (
        <div className="pointer-events-none absolute inset-0 opacity-100">
          <div className="absolute inset-0 animate-alarm" />
          <div className="absolute inset-x-0 -top-1/2 h-1/2 scanline" />
        </div>
      ) : null}

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
            Safety Auditor
          </div>
          {active ? (
            <div className="rounded-full border border-danger/40 bg-danger/15 px-2 py-0.5 font-mono text-xs text-danger">
              FLAGGED
            </div>
          ) : (
            <div className="rounded-full border border-stroke bg-panel2/60 px-2 py-0.5 font-mono text-xs text-lilac-ash">
              CLEAR
            </div>
          )}
        </div>

        <div className={cn("mt-2 font-mono text-lg", active ? "text-danger" : "text-lavender")}>
          {title}
        </div>
        <div className="mt-1 text-sm text-lilac-ash">{description}</div>
      </div>
    </div>
  );
}

