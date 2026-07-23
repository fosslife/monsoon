import { IconDatabase, IconUsb } from "@tabler/icons-react";
import { useState } from "react";

import { StatMeter } from "@/components/stat-meter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStream } from "@/hooks/use-stream";
import { formatBytes, formatRate } from "@/lib/format";
import type { DiskInfo } from "@/types/system";

export const Disks = () => {
  const [disks, setDisks] = useState<DiskInfo[]>([]);

  useStream<DiskInfo[]>("disks", setDisks);

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Disks</h1>
        <p className="text-sm text-muted-foreground">
          Mounted volumes with capacity and live I/O rates.
        </p>
      </header>

      {disks.length === 0 && (
        <p className="text-sm text-muted-foreground">Waiting for data…</p>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {disks.map((disk) => {
          const used = disk.total_space - disk.available_space;
          return (
            <Card key={`${disk.name}-${disk.mount_point}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <IconDatabase
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="truncate" title={disk.name}>
                      {disk.name || disk.mount_point}
                    </span>
                    {disk.removable && (
                      <IconUsb
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-label="Removable"
                      />
                    )}
                  </span>
                  <span className="flex shrink-0 gap-1.5 text-[10px] font-normal">
                    <span className="rounded bg-muted px-1.5 py-0.5">
                      {disk.kind}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                      {disk.file_system}
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <StatMeter
                  label={disk.mount_point}
                  display={`${formatBytes(used)} / ${formatBytes(disk.total_space)}`}
                  value={used}
                  max={disk.total_space}
                  color="var(--chart-4)"
                />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>
                    Read{" "}
                    <span className="stat-figure text-foreground">
                      {formatRate(disk.read_rate)}
                    </span>
                  </span>
                  <span>
                    Write{" "}
                    <span className="stat-figure text-foreground">
                      {formatRate(disk.write_rate)}
                    </span>
                  </span>
                  <span className="ml-auto">
                    Free{" "}
                    <span className="stat-figure text-foreground">
                      {formatBytes(disk.available_space)}
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
