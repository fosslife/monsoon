import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration, formatUnixTimestamp } from "@/lib/format";
import type { SystemInfo } from "@/types/system";

export const Home = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);

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

  const rows: [string, string | undefined][] = [
    ["Hostname", systemInfo?.hostname],
    ["Operating system", systemInfo?.os_name],
    ["OS version", systemInfo?.os_version],
    ["Kernel", systemInfo?.os_kernel_version],
    ["Distribution", systemInfo?.distribution_id],
    ["Architecture", systemInfo?.cpu_arch],
    [
      "Boot time",
      systemInfo ? formatUnixTimestamp(systemInfo.boot_time) : undefined,
    ],
    ["Uptime", uptime === null ? undefined : formatDuration(uptime)],
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Static system information for this machine.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">System</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2"
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="stat-figure truncate text-sm" title={value}>
                  {value ?? "…"}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};
