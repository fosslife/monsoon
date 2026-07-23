import { useCallback, useState } from "react";

import { StatMeter } from "@/components/stat-meter";
import { UsageChart, type UsagePoint } from "@/components/usage-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRollingHistory } from "@/hooks/use-rolling-history";
import { useStream } from "@/hooks/use-stream";
import { formatBytes, formatPercent } from "@/lib/format";
import type { MemorySnapshot } from "@/types/system";

const MEMORY_COLOR = "var(--chart-2)";
const SWAP_COLOR = "var(--chart-4)";

const Memory = () => {
  const [latest, setLatest] = useState<MemorySnapshot | null>(null);
  const [history, pushHistory] = useRollingHistory<number>(60);

  useStream<MemorySnapshot>(
    "memory",
    useCallback(
      (snapshot) => {
        setLatest(snapshot);
        pushHistory(
          snapshot.total > 0 ? (snapshot.used / snapshot.total) * 100 : 0,
        );
      },
      [pushHistory],
    ),
  );

  const points: UsagePoint[] = history.map((value, index) => ({
    age: history.length - 1 - index,
    value,
  }));

  const usedPercent =
    latest && latest.total > 0 ? (latest.used / latest.total) * 100 : null;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Memory</h1>
        <p className="text-sm text-muted-foreground">
          RAM and swap usage, sampled every second.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-baseline justify-between space-y-0">
          <CardTitle className="text-base">RAM</CardTitle>
          <span className="stat-figure text-2xl font-semibold">
            {usedPercent === null ? "…" : formatPercent(usedPercent)}
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <UsageChart
            points={points}
            color={MEMORY_COLOR}
            valueLabel="Memory"
          />
          {latest && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatMeter
                label="Used"
                display={`${formatBytes(latest.used)} / ${formatBytes(latest.total)}`}
                value={latest.used}
                max={latest.total}
                color={MEMORY_COLOR}
              />
              <StatMeter
                label="Available"
                display={formatBytes(latest.available)}
                value={latest.available}
                max={latest.total}
                color="var(--chart-3)"
              />
              <StatMeter
                label="Free"
                display={formatBytes(latest.free)}
                value={latest.free}
                max={latest.total}
                color="var(--chart-1)"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Swap</CardTitle>
        </CardHeader>
        <CardContent>
          {latest === null ? (
            <p className="text-sm text-muted-foreground">Waiting for data…</p>
          ) : latest.swap_total === 0 ? (
            <p className="text-sm text-muted-foreground">
              No swap is configured on this system.
            </p>
          ) : (
            <StatMeter
              label="Used"
              display={`${formatBytes(latest.swap_used)} / ${formatBytes(latest.swap_total)}`}
              value={latest.swap_used}
              max={latest.swap_total}
              color={SWAP_COLOR}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { Memory };
