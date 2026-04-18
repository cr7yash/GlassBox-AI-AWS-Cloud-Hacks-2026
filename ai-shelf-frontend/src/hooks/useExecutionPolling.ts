import { useEffect, useMemo, useRef, useState } from "react";
import type { ExecutionTrace } from "@/types/execution";
import { mockExecutions } from "@/data/mockExecutions";

type UseExecutionPollingOptions = {
  intervalMs?: number;
  enabled?: boolean;
  mode?: "mock" | "live";
};

type UseExecutionPollingResult = {
  executions: ExecutionTrace[];
  isLoading: boolean;
  error: string | null;
  lastUpdatedAt: number | null;
};

function sortByTimestampDesc(a: ExecutionTrace, b: ExecutionTrace) {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

export function useExecutionPolling(
  opts: UseExecutionPollingOptions = {}
): UseExecutionPollingResult {
  const { intervalMs = 2000, enabled = true, mode = "mock" } = opts;
  const [executions, setExecutions] = useState<ExecutionTrace[]>([]);
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
          if (!cancelled) {
            setExecutions(mockExecutions.slice().sort(sortByTimestampDesc));
            setIsLoading(false);
            setLastUpdatedAt(Date.now());
          }
          return;
        }

        // Live mode shape suggestion:
        // GET /executions -> ExecutionTrace[]
        const res = await fetch(`${baseUrl}/executions`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status} from /executions`);
        const data = (await res.json()) as ExecutionTrace[];
        if (!cancelled) {
          setExecutions(data.slice().sort(sortByTimestampDesc));
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
    timer.current = window.setInterval(() => void tick(), intervalMs);
    return () => {
      cancelled = true;
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
    };
  }, [baseUrl, enabled, intervalMs, mode]);

  return { executions, isLoading, error, lastUpdatedAt };
}

