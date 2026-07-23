type StatMeterProps = {
  label: string;
  /** Preformatted readout shown on the right, e.g. "12.4 GiB / 32.0 GiB". */
  display: string;
  value: number;
  max: number;
  /** Any CSS color; typically `var(--chart-N)`. */
  color: string;
};

export function StatMeter({
  label,
  display,
  value,
  max,
  color,
}: StatMeterProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="stat-figure text-xs">{display}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
