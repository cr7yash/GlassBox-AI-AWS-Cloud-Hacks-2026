import type { TraceLogEvent } from "@/types/trace";
import { MetricCard } from "@/components/MetricCard";
import { StatusIndicator } from "@/components/StatusIndicator";
import { RadialGauge } from "@/components/RadialGauge";

type FacilityTwinProps = {
  latest: TraceLogEvent | undefined;
};

function toneForTemp(f: number) {
  if (f >= 200) return "danger";
  if (f >= 105) return "warning";
  return "ok";
}

function toneForCost(cost: number) {
  if (cost >= 0.4) return "warning";
  if (cost >= 0.6) return "danger";
  return "ok";
}

export function FacilityTwin({ latest }: FacilityTwinProps) {
  const temp = latest?.facility_state.outside_temp_f ?? 0;
  const crowd = latest?.facility_state.attendance ?? 0;
  const cost = latest?.facility_state.grid_cost_kwh ?? 0;

  // Demo-only inferred statuses (swap with real telemetry later)
  const hvacTone = temp >= 105 ? "warning" : "ok";
  const roofTone = temp >= 100 ? "ok" : "off";
  const lightsTone = latest?.agent_trace.action === "set_zone_lighting" ? "danger" : "ok";

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
          Facility Twin
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-1">
          <RadialGauge
            label="Stadium Stability"
            value={temp >= 200 ? 0.15 : temp >= 105 ? 0.55 : 0.82}
            centerText={temp >= 200 ? "ALERT" : temp >= 105 ? "HIGH" : "OK"}
            tone={temp >= 200 ? "danger" : temp >= 105 ? "warning" : "ok"}
          />
          <RadialGauge
            label="Grid Pressure"
            value={Math.min(1, cost / 0.6)}
            centerText={`$${cost.toFixed(2)}`}
            tone={cost >= 0.5 ? "danger" : cost >= 0.4 ? "warning" : "ok"}
          />
        </div>
        <div className="mt-3 grid gap-3">
          <MetricCard
            label="Current Temp"
            value={`${temp.toFixed(0)}°F`}
            hint={temp >= 200 ? "Sensor anomaly suspected" : "External sensor feed"}
            tone={toneForTemp(temp)}
          />
          <MetricCard
            label="Crowd Size"
            value={crowd.toLocaleString()}
            hint="Ticket gates + section counters"
            tone="neutral"
          />
          <MetricCard
            label="Energy Cost"
            value={`$${cost.toFixed(2)}/kWh`}
            hint={cost >= 0.4 ? "Peak pricing window" : "Normal pricing"}
            tone={toneForCost(cost)}
          />
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.22em] text-lilac-ash">
            Systems
          </div>
          <div className="font-mono text-xs text-lilac-ash">ops panel</div>
        </div>

        <div className="mt-3 space-y-2">
          <StatusIndicator label="HVAC" value={hvacTone === "warning" ? "HIGH LOAD" : "NOMINAL"} tone={hvacTone} />
          <StatusIndicator label="ROOF" value={roofTone === "ok" ? "OPEN" : "CLOSED"} tone={roofTone} />
          <StatusIndicator label="LIGHTS" value={lightsTone === "danger" ? "CONCOURSE OFF" : "ON"} tone={lightsTone} />
        </div>
      </div>
    </div>
  );
}

