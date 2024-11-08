import { invoke } from "@tauri-apps/api/core";
import { Channel } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type MemInfo = {
  total: number;
  free: number;
  available: number;
  swap_total: number;
  swap_free: number;
};

const Memory = () => {
  const [memInfo, setMemInfo] = useState<MemInfo[]>([]);

  useEffect(() => {
    const onEvent = new Channel<MemInfo>();
    onEvent.onmessage = (mem) => {
      setMemInfo((prevMemInfo) => {
        const newMemInfo = [...prevMemInfo, mem];
        return newMemInfo.slice(-60);
      });
    };
    invoke("get_memory_info", { onEvent });
    return () => {
      console.log("stop_memory_info");
      emit("stop_memory_info");
    };
  }, []);

  // Transform the data array to include percentage calculations
  const data = memInfo.map((mem, index) => ({
    seconds: index, // Use array index as seconds
    usage: ((mem.total - mem.available) / mem.total) * 100,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <defs>
            <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="seconds"
            type="number"
            domain={[0, 59]}
            ticks={[0, 15, 30, 45, 59]} // Show ticks at these intervals
            tickFormatter={(value) => `${value}s`}
            label={{
              value: "Time (seconds)",
              position: "bottom",
              offset: 5,
            }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
            axisLine={{ stroke: "#E5E7EB" }}
            tickLine={false}
            label={{
              value: "Memory Usage (%)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            formatter={(value) => [
              `${Number(value).toFixed(2)}%`,
              "Memory Usage",
            ]}
            labelFormatter={(label) => `${label}s`}
          />
          <Area
            type="monotone"
            dataKey="usage"
            stroke="#82ca9d"
            fill="url(#memoryGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {memInfo.length > 0 && (
        <div className="flex flex-col gap-2">
          <p>Total: {formatSize(memInfo[memInfo.length - 1].total)}</p>
          <p>Free: {formatSize(memInfo[memInfo.length - 1].free)}</p>
          <p>
            Swap Total: {formatSize(memInfo[memInfo.length - 1].swap_total)}
          </p>
          <p>Swap Free: {formatSize(memInfo[memInfo.length - 1].swap_free)}</p>
        </div>
      )}
    </div>
  );
};

function formatSize(bytes: number) {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) {
    return `${(bytes / GB).toFixed(2)} GB`;
  } else if (bytes >= MB) {
    return `${(bytes / MB).toFixed(2)} MB`;
  }
  return `${bytes} B`;
}

export { Memory };
