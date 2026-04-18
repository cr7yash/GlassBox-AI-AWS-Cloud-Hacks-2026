import { useEffect, useMemo, useRef, useState } from "react";
import type { TraceLogEvent } from "@/types/trace";
import { mockLogs } from "@/data/mockLogs";

type UseTracePollingOptions = {
  intervalMs?: number;
  enabled?: boolean;
  mode?: "mock" | "live";
};

type UseTracePollingResult = {
  events: TraceLogEvent[];
  isLoading: boolean;
  error: string | null;
  lastUpdatedAt: number | null;
};

function sortByTimestampAsc(a: TraceLogEvent, b: TraceLogEvent) {
  return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
}

export function useTracePolling(
  traceId: string,
  opts: UseTracePollingOptions = {}
): UseTracePollingResult {
  const { intervalMs = 2000, enabled = true, mode = "mock" } = opts;
  const [events, setEvents] = useState<TraceLogEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  const baseUrl = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_LOGS_BASE_URL ?? "";
    return raw.replace(/\/+$/, "");
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function tick() {
      try {
        setError(null);
        if (mode === "mock") {
          const filtered = mockLogs
            .filter((e) => e.trace_id === traceId)
            .slice()
            .sort(sortByTimestampAsc);
          if (!cancelled) {
            setEvents(filtered);
            setIsLoading(false);
            setLastUpdatedAt(Date.now());
          }
          return;
        }

        const url = `${baseUrl}/logs?trace_id=${encodeURIComponent(traceId)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status} from /logs`);

        const data = (await res.json()) as TraceLogEvent[] | TraceLogEvent;
        const normalized = Array.isArray(data) ? data : [data];
        const filtered = normalized
          .filter((e) => e.trace_id === traceId)
          .slice()
          .sort(sortByTimestampAsc);

        if (!cancelled) {
          setEvents(filtered);
          setIsLoading(false);
          setLastUpdatedAt(Date.now());
        }
      } catch (e) {
        if (!cancelled) {
          setIsLoading(false);
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      }
    }

    void tick();

    timer.current = window.setInterval(() => {
      void tick();
    }, intervalMs);

    return () => {
      cancelled = true;
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
    };
  }, [baseUrl, enabled, intervalMs, mode, traceId]);

  return { events, isLoading, error, lastUpdatedAt };
}

