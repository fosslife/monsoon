import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { invoke, Channel } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

type CPUInfo = {
  cpu_brand: string;
  physical_cores: number;
  logical_cores: number;
};

type CoreInfo = {
  core_id: number;
  core_name: string;
  core_usage: number;
  frequency: number;
};

export const CPU = () => {
  const [cpuInfo, setCpuInfo] = useState<CPUInfo | null>(null);
  const [coreInfo, setCoreInfo] = useState<CoreInfo[]>([]);

  const onEvent = new Channel<CoreInfo[]>();

  onEvent.onmessage = (coreInfo) => {
    console.log("EVENT: ", coreInfo);
    setCoreInfo(coreInfo);
  };

  useEffect(() => {
    let unlisten = listen<CPUInfo>("cpu_info", ({ payload }) => {
      setCpuInfo(payload);
    });

    return () => {
      console.log("unlisten");
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    invoke<CPUInfo>("get_cpu_info", { onEvent });

    return () => {
      emit("stop_cpu_info");
    };
  }, []);

  return (
    <div>
      <button onClick={() => emit("stop_cpu_info")}>Stop</button>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{cpuInfo?.cpu_brand}</CardTitle>
          <div className="flex gap-2">
            {" "}
            <span className="text-xs text-slate-500">
              Logical cores: {cpuInfo?.logical_cores}
            </span>
            <span className="text-xs text-slate-500">
              Physical cores: {cpuInfo?.physical_cores}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={coreInfo}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="core_name" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="core_usage"
                stroke="#8884d8"
                fill="#8884d8"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
