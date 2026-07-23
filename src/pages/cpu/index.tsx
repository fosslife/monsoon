import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";

import { UsageChart, type UsagePoint } from "@/components/usage-chart";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRollingHistory } from "@/hooks/use-rolling-history";
import { useStream } from "@/hooks/use-stream";
import { formatBytes, formatFrequency, formatPercent } from "@/lib/format";
import type { CpuSnapshot, CpuStatic } from "@/types/system";

const CPU_COLOR = "var(--chart-1)";

export const CPU = () => {
  const [statics, setStatics] = useState<CpuStatic | null>(null);
  const [latest, setLatest] = useState<CpuSnapshot | null>(null);
  const [history, pushHistory] = useRollingHistory<CpuSnapshot>(60);
  const [view, setView] = useState<"overall" | "cores">("overall");

  useEffect(() => {
    invoke<CpuStatic>("get_cpu_static")
      .then(setStatics)
      .catch((error: unknown) => console.error("get_cpu_static failed", error));
  }, []);

  useStream<CpuSnapshot>(
    "cpu",
    useCallback(
      (snapshot) => {
        setLatest(snapshot);
        pushHistory(snapshot);
      },
      [pushHistory],
    ),
  );

  const overallPoints: UsagePoint[] = useMemo(
    () =>
      history.map((snapshot, index) => ({
        age: history.length - 1 - index,
        value: snapshot.global_usage,
      })),
    [history],
  );

  const corePoints = useMemo(() => {
    if (view !== "cores") return [];
    const byCore = new Map<string, UsagePoint[]>();
    history.forEach((snapshot, index) => {
      const age = history.length - 1 - index;
      for (const core of snapshot.cores) {
        const points = byCore.get(core.name) ?? [];
        points.push({ age, value: core.usage });
        byCore.set(core.name, points);
      }
    });
    return [...byCore.entries()];
  }, [history, view]);

  const averageFrequency = useMemo(() => {
    if (!latest || latest.cores.length === 0) return null;
    const total = latest.cores.reduce((sum, core) => sum + core.frequency, 0);
    return total / latest.cores.length;
  }, [latest]);

  const coreByName = useMemo(
    () => new Map(latest?.cores.map((core) => [core.name, core]) ?? []),
    [latest],
  );

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">CPU</h1>
        <p className="text-sm text-muted-foreground">
          {statics?.brand ?? "Detecting processor…"}
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {statics && (
              <>
                <span className="rounded-md bg-muted px-2 py-1">
                  {statics.physical_cores} physical / {statics.logical_cores}{" "}
                  logical cores
                </span>
                {averageFrequency !== null && (
                  <span className="stat-figure rounded-md bg-muted px-2 py-1">
                    {formatFrequency(averageFrequency)} avg
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="stat-figure text-2xl font-semibold">
              {latest ? formatPercent(latest.global_usage) : "…"}
            </span>
            <div className="flex rounded-md border border-border p-0.5">
              <Button
                size="sm"
                variant={view === "overall" ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setView("overall")}
              >
                Overall
              </Button>
              <Button
                size="sm"
                variant={view === "cores" ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setView("cores")}
              >
                Per core
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === "overall" ? (
            <UsageChart points={overallPoints} color={CPU_COLOR} height={300} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {corePoints.map(([name, points]) => {
                const core = coreByName.get(name);
                return (
                  <div
                    key={name}
                    className="rounded-lg border border-border/60 p-2"
                  >
                    <div className="flex items-baseline justify-between px-1 pb-1">
                      <span className="text-xs font-medium">{name}</span>
                      <span className="stat-figure text-xs text-muted-foreground">
                        {core
                          ? `${formatPercent(core.usage, 0)} · ${formatFrequency(core.frequency)}`
                          : "…"}
                      </span>
                    </div>
                    <UsageChart
                      points={points}
                      color={CPU_COLOR}
                      height={140}
                      compact
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {statics &&
        (statics.cache_sizes.length > 0 || statics.features.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Processor details</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue="cache">
                {statics.cache_sizes.length > 0 && (
                  <AccordionItem value="cache">
                    <AccordionTrigger>Cache</AccordionTrigger>
                    <AccordionContent>
                      <ul className="flex flex-col gap-1">
                        {statics.cache_sizes.map((cache) => (
                          <li
                            key={cache.label}
                            className="flex items-baseline justify-between border-b border-border/60 pb-1 text-sm"
                          >
                            <span className="text-muted-foreground">
                              {cache.label}
                            </span>
                            <span className="stat-figure">
                              {formatBytes(cache.bytes, 0)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {statics.features.length > 0 && (
                  <AccordionItem value="features">
                    <AccordionTrigger>
                      Instruction set features
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-1.5">
                        {statics.features.map((feature) => (
                          <span
                            key={feature}
                            className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </CardContent>
          </Card>
        )}
    </div>
  );
};
