import {
  IconActivity,
  IconArrowDown,
  IconArrowUp,
  IconCpu,
  IconDeviceSdCard,
  IconListDetails,
} from "@tabler/icons-react";

import { useMetrics } from "@/components/metrics-provider";
import { formatBytes, formatPercent, formatRate } from "@/lib/format";

function Segment({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof IconCpu;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5" style={{ color }} aria-hidden />
      <span className="text-muted-foreground">{label}</span>
      <span className="stat-figure text-foreground">{value}</span>
    </div>
  );
}

/** Thin always-visible strip with live global metrics. */
export function StatusFooter() {
  const { latest } = useMetrics();

  return (
    <footer className="flex h-7 shrink-0 items-center gap-5 overflow-hidden border-t border-sidebar-border bg-sidebar px-3 text-[11px] whitespace-nowrap">
      <Segment
        icon={IconCpu}
        label="CPU"
        value={latest ? formatPercent(latest.cpu_global) : "…"}
        color="var(--chart-1)"
      />
      <Segment
        icon={IconDeviceSdCard}
        label="MEM"
        value={
          latest
            ? `${formatBytes(latest.mem_used)} / ${formatBytes(latest.mem_total)}`
            : "…"
        }
        color="var(--chart-2)"
      />
      <Segment
        icon={IconListDetails}
        label="PROCS"
        value={latest ? String(latest.process_count) : "…"}
        color="var(--chart-3)"
      />
      <div className="flex items-center gap-1.5">
        <IconActivity
          className="size-3.5"
          style={{ color: "var(--chart-4)" }}
          aria-hidden
        />
        <span className="text-muted-foreground">NET</span>
        <span className="stat-figure flex items-center gap-0.5 text-foreground">
          <IconArrowDown className="size-3 text-muted-foreground" aria-hidden />
          {latest ? formatRate(latest.net_rx) : "…"}
          <IconArrowUp
            className="ml-1 size-3 text-muted-foreground"
            aria-hidden
          />
          {latest ? formatRate(latest.net_tx) : "…"}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <span
          className="size-1.5 animate-pulse rounded-full"
          style={{ backgroundColor: "var(--chart-3)" }}
          aria-hidden
        />
        <span className="text-muted-foreground">live · 1s</span>
      </div>
    </footer>
  );
}
