import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";

import { Sparkline } from "@/components/sparkline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRollingHistory } from "@/hooks/use-rolling-history";
import { useStream } from "@/hooks/use-stream";
import { formatBytes, formatRate } from "@/lib/format";
import type { NetworkInfo } from "@/types/system";

export const Network = () => {
  const [interfaces, setInterfaces] = useState<NetworkInfo[]>([]);
  const [history, pushHistory] = useRollingHistory<NetworkInfo[]>(60);

  useStream<NetworkInfo[]>(
    "networks",
    useCallback(
      (snapshot) => {
        setInterfaces(snapshot);
        pushHistory(snapshot);
      },
      [pushHistory],
    ),
  );

  // Per-interface rate series derived from the rolling window.
  const seriesByName = useMemo(() => {
    const map = new Map<string, { rx: number; tx: number }[]>();
    for (const snapshot of history) {
      for (const iface of snapshot) {
        const points = map.get(iface.name) ?? [];
        points.push({ rx: iface.received_rate, tx: iface.transmitted_rate });
        map.set(iface.name, points);
      }
    }
    return map;
  }, [history]);

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Network</h1>
        <p className="text-sm text-muted-foreground">
          Per-interface throughput, sampled every second.
        </p>
      </header>

      {interfaces.length === 0 && (
        <p className="text-sm text-muted-foreground">Waiting for data…</p>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {interfaces.map((iface) => (
          <Card key={iface.name}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-baseline justify-between gap-2 text-sm">
                <span className="stat-figure truncate">{iface.name}</span>
                <span className="flex shrink-0 gap-3 text-xs font-normal">
                  <span className="stat-figure flex items-center gap-1">
                    <IconArrowDown
                      className="size-3.5"
                      style={{ color: "var(--chart-3)" }}
                      aria-hidden
                    />
                    {formatRate(iface.received_rate)}
                  </span>
                  <span className="stat-figure flex items-center gap-1">
                    <IconArrowUp
                      className="size-3.5"
                      style={{ color: "var(--chart-5)" }}
                      aria-hidden
                    />
                    {formatRate(iface.transmitted_rate)}
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Sparkline
                data={seriesByName.get(iface.name) ?? []}
                series={[
                  { key: "rx", color: "var(--chart-3)" },
                  { key: "tx", color: "var(--chart-5)" },
                ]}
                height={72}
              />
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>
                  Total ↓{" "}
                  <span className="stat-figure text-foreground">
                    {formatBytes(iface.total_received)}
                  </span>
                </span>
                <span>
                  Total ↑{" "}
                  <span className="stat-figure text-foreground">
                    {formatBytes(iface.total_transmitted)}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
