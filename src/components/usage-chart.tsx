import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** One sample in a rolling window; `age` is seconds ago (0 = now). */
export type UsagePoint = {
  age: number;
  value: number;
};

type UsageChartProps = {
  points: UsagePoint[];
  /** Any CSS color; typically `var(--chart-N)`. */
  color: string;
  height?: number;
  windowSeconds?: number;
  valueLabel?: string;
  compact?: boolean;
};

/**
 * Rolling-window area chart shared by every metric page. Newest samples
 * render on the right; animation is off because data shifts every second.
 */
export function UsageChart({
  points,
  color,
  height = 260,
  windowSeconds = 60,
  valueLabel = "Usage",
  compact = false,
}: UsageChartProps) {
  const gradientId = useId();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={points}
        margin={{ top: 8, right: 8, left: compact ? -16 : 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="age"
          type="number"
          reversed
          domain={[0, windowSeconds]}
          ticks={compact ? [windowSeconds, 0] : [60, 45, 30, 15, 0]}
          tickFormatter={(age: number) => (age === 0 ? "now" : `-${age}s`)}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          ticks={compact ? [0, 50, 100] : [0, 25, 50, 75, 100]}
          tickFormatter={(value: number) => `${value}%`}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={compact ? 46 : 40}
        />
        <Tooltip
          isAnimationActive={false}
          contentStyle={{
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "calc(var(--radius) - 2px)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
          labelFormatter={(age) => (Number(age) === 0 ? "now" : `${age}s ago`)}
          formatter={(value) => [`${Number(value).toFixed(1)}%`, valueLabel]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
