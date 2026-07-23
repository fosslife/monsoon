import { formatPercent } from "@/lib/format";

/**
 * Load → color: cyan (idle) → amber (busy) → red (saturated).
 * Uses color-mix so the scale follows the active theme's chart palette.
 */
export function heatColor(usage: number): string {
  const clamped = Math.max(0, Math.min(100, usage));
  if (clamped < 50) {
    const t = Math.round((clamped / 50) * 100);
    return `color-mix(in oklab, var(--chart-4) ${t}%, var(--chart-1))`;
  }
  const t = Math.round(((clamped - 50) / 50) * 100);
  return `color-mix(in oklab, var(--chart-5) ${t}%, var(--chart-4))`;
}

type CoreHeatmapProps = {
  /** Per-core usage percentages, in core order. */
  usages: number[];
  /** Compact strip (dashboard) vs labeled cells (CPU page). */
  variant?: "strip" | "cells";
};

export function CoreHeatmap({ usages, variant = "strip" }: CoreHeatmapProps) {
  if (variant === "strip") {
    return (
      <div className="flex flex-wrap gap-1" aria-label="Per-core load">
        {usages.map((usage, index) => (
          <div
            key={index}
            title={`Core ${index}: ${formatPercent(usage)}`}
            className="h-3 min-w-3 flex-1 rounded-[3px] transition-colors duration-500"
            style={{
              backgroundColor: heatColor(usage),
              opacity: 0.35 + (Math.min(usage, 100) / 100) * 0.65,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1.5"
      aria-label="Per-core load"
    >
      {usages.map((usage, index) => (
        <div
          key={index}
          className="flex flex-col items-center gap-0.5 rounded-md border border-border/60 px-1 py-1.5"
        >
          <span className="text-[10px] text-muted-foreground">C{index}</span>
          <span
            className="stat-figure text-xs font-semibold"
            style={{ color: heatColor(usage) }}
          >
            {formatPercent(usage, 0)}
          </span>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.min(usage, 100)}%`,
                backgroundColor: heatColor(usage),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
