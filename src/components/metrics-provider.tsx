import { createContext, useCallback, useContext, useState } from "react";

import { useRollingHistory } from "@/hooks/use-rolling-history";
import { useStream } from "@/hooks/use-stream";
import type { OverviewSnapshot } from "@/types/system";

type MetricsState = {
  latest: OverviewSnapshot | null;
  /** Last 60 snapshots, oldest first. */
  history: OverviewSnapshot[];
};

const MetricsContext = createContext<MetricsState>({
  latest: null,
  history: [],
});

/**
 * Single app-level subscription to the backend `overview` stream, shared by
 * the dashboard and the status footer. Only one subscriber may exist per
 * stream name (starting a stream cancels its predecessor), so consumers MUST
 * read from this context instead of calling useStream("overview") themselves.
 */
export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [latest, setLatest] = useState<OverviewSnapshot | null>(null);
  const [history, pushHistory] = useRollingHistory<OverviewSnapshot>(60);

  useStream<OverviewSnapshot>(
    "overview",
    useCallback(
      (snapshot) => {
        setLatest(snapshot);
        pushHistory(snapshot);
      },
      [pushHistory],
    ),
  );

  return (
    <MetricsContext.Provider value={{ latest, history }}>
      {children}
    </MetricsContext.Provider>
  );
}

export const useMetrics = () => useContext(MetricsContext);
