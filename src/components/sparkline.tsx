import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

type SparklineSeries = {
  key: string;
  color: string;
};

type SparklineProps = {
  /** Samples oldest-first; each record holds one value per series key. */
  data: Record<string, number>[];
  series: SparklineSeries[];
  height?: number;
  /** Fixed Y max (e.g. 100 for percentages); omit for auto-scale. */
  max?: number;
};

/** Minimal axis-less area chart for dense dashboard panels. */
export function Sparkline({ data, series, height = 64, max }: SparklineProps) {
  const gradientId = useId();
  // Glow tracks the stroke color; skip for multi-series charts where one
  // shared glow color would misrepresent the second series.
  const glow =
    series.length === 1
      ? ({ "--glow-color": series[0].color } as React.CSSProperties)
      : undefined;

  return (
    <div className={glow ? "chart-glow" : undefined} style={glow}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`${gradientId}-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={s.color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <YAxis hide domain={[0, max ?? "auto"]} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={1.5}
              fill={`url(#${gradientId}-${s.key})`}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
