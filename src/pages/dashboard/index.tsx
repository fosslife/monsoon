import {
  IconArrowDown,
  IconArrowUp,
  IconFileDescription,
  IconFileDownload,
} from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

import { CoreHeatmap } from "@/components/core-heatmap";
import { useMetrics } from "@/components/metrics-provider";
import { Sparkline } from "@/components/sparkline";
import { StatMeter } from "@/components/stat-meter";
import { useStream } from "@/hooks/use-stream";
import {
  formatBytes,
  formatDuration,
  formatPercent,
  formatRate,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DiskInfo, SystemInfo } from "@/types/system";

function Panel({
  title,
  value,
  className,
  children,
}: {
  title: string;
  value?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-card p-3",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          {title}
        </h2>
        {value && (
          <span className="stat-figure text-sm font-semibold">{value}</span>
        )}
      </div>
      {children}
    </section>
  );
}

export const Dashboard = () => {
  const { latest, history } = useMetrics();
  const [disks, setDisks] = useState<DiskInfo[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);

  useStream<DiskInfo[]>("disks", setDisks);

  useEffect(() => {
    invoke<SystemInfo>("get_system_info")
      .then((info) => {
        setSystemInfo(info);
        setUptime(info.uptime);
      })
      .catch((error: unknown) =>
        console.error("get_system_info failed", error),
      );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime((prev) => (prev === null ? prev : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const cpuPoints = history.map((s) => ({ cpu: s.cpu_global }));
  const netPoints = history.map((s) => ({ rx: s.net_rx, tx: s.net_tx }));
  const memPoints = history.map((s) => ({
    mem: s.mem_total > 0 ? (s.mem_used / s.mem_total) * 100 : 0,
  }));

  const memPercent =
    latest && latest.mem_total > 0
      ? (latest.mem_used / latest.mem_total) * 100
      : null;

  return (
    <div className="grid grid-cols-12 gap-2">
      <Panel
        title="CPU"
        value={latest ? formatPercent(latest.cpu_global) : "…"}
        className="col-span-12 lg:col-span-7"
      >
        <Sparkline
          data={cpuPoints}
          series={[{ key: "cpu", color: "var(--chart-1)" }]}
          height={88}
          max={100}
        />
        {latest && <CoreHeatmap usages={latest.core_usages} />}
      </Panel>

      <Panel
        title="Memory"
        value={memPercent === null ? "…" : formatPercent(memPercent)}
        className="col-span-12 lg:col-span-5"
      >
        <Sparkline
          data={memPoints}
          series={[{ key: "mem", color: "var(--chart-2)" }]}
          height={88}
          max={100}
        />
        {latest && (
          <div className="flex flex-col gap-2">
            <StatMeter
              label="RAM"
              display={`${formatBytes(latest.mem_used)} / ${formatBytes(latest.mem_total)}`}
              value={latest.mem_used}
              max={latest.mem_total}
              color="var(--chart-2)"
            />
            {latest.swap_total > 0 && (
              <StatMeter
                label="Swap"
                display={`${formatBytes(latest.swap_used)} / ${formatBytes(latest.swap_total)}`}
                value={latest.swap_used}
                max={latest.swap_total}
                color="var(--chart-4)"
              />
            )}
          </div>
        )}
      </Panel>

      <Panel
        title="Network"
        className="col-span-12 sm:col-span-6 lg:col-span-4"
      >
        <div className="flex items-center gap-3 text-xs">
          <span className="stat-figure flex items-center gap-1">
            <IconArrowDown
              className="size-3.5"
              style={{ color: "var(--chart-3)" }}
              aria-hidden
            />
            {latest ? formatRate(latest.net_rx) : "…"}
          </span>
          <span className="stat-figure flex items-center gap-1">
            <IconArrowUp
              className="size-3.5"
              style={{ color: "var(--chart-5)" }}
              aria-hidden
            />
            {latest ? formatRate(latest.net_tx) : "…"}
          </span>
        </div>
        <Sparkline
          data={netPoints}
          series={[
            { key: "rx", color: "var(--chart-3)" },
            { key: "tx", color: "var(--chart-5)" },
          ]}
          height={72}
        />
      </Panel>

      <Panel title="Disks" className="col-span-12 sm:col-span-6 lg:col-span-4">
        <div className="flex items-center gap-3 text-xs">
          <span className="stat-figure flex items-center gap-1">
            <IconFileDescription
              className="size-3.5 text-muted-foreground"
              aria-hidden
            />
            R {latest ? formatRate(latest.disk_read) : "…"}
          </span>
          <span className="stat-figure flex items-center gap-1">
            <IconFileDownload
              className="size-3.5 text-muted-foreground"
              aria-hidden
            />
            W {latest ? formatRate(latest.disk_write) : "…"}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {disks.slice(0, 4).map((disk) => (
            <StatMeter
              key={`${disk.name}-${disk.mount_point}`}
              label={disk.mount_point}
              display={`${formatBytes(disk.total_space - disk.available_space)} / ${formatBytes(disk.total_space)}`}
              value={disk.total_space - disk.available_space}
              max={disk.total_space}
              color="var(--chart-4)"
            />
          ))}
          {disks.length === 0 && (
            <p className="text-xs text-muted-foreground">Waiting for data…</p>
          )}
        </div>
      </Panel>

      <Panel title="Top processes" className="col-span-12 lg:col-span-4">
        <table className="w-full text-xs">
          <tbody>
            {(latest?.top_processes ?? []).map((process) => (
              <tr
                key={process.pid}
                className="border-b border-border/40 last:border-0"
              >
                <td className="max-w-[120px] truncate py-1 pr-2 font-medium">
                  {process.name}
                </td>
                <td className="stat-figure py-1 pr-2 text-right text-muted-foreground">
                  {formatBytes(process.memory)}
                </td>
                <td
                  className="stat-figure py-1 text-right font-semibold"
                  style={{ color: "var(--chart-1)" }}
                >
                  {formatPercent(process.cpu_usage)}
                </td>
              </tr>
            ))}
            {!latest && (
              <tr>
                <td className="py-1 text-muted-foreground">
                  Waiting for data…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      <Panel title="System" className="col-span-12">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
          {(
            [
              ["Host", systemInfo?.hostname],
              [
                "OS",
                systemInfo
                  ? `${systemInfo.os_name} ${systemInfo.os_version}`
                  : undefined,
              ],
              ["Kernel", systemInfo?.os_kernel_version],
              ["Uptime", uptime === null ? undefined : formatDuration(uptime)],
            ] as [string, string | undefined][]
          ).map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-2"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="stat-figure truncate" title={value}>
                {value ?? "…"}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
};
