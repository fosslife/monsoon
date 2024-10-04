import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { invoke, Channel } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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

type CoreHistory = {
  core_name: string;
  data: {
    timestamp: number;
    usage: number;
    frequency: number;
  }[];
};

type CoresHistoryState = CoreHistory[];

export const CPU = () => {
  const [cpuInfo, setCpuInfo] = useState<CPUInfo | null>(null);
  const [coreInfo, setCoreInfo] = useState<CoreInfo[]>([]);
  const [coresHistory, setCoresHistory] = useState<CoresHistoryState>([]);
  const [realtimeMode, setRealtimeMode] = useState(false);

  const onEvent = new Channel<CoreInfo[]>();

  onEvent.onmessage = (coreInfo) => {
    console.log("EVENT: ", coreInfo);
    setCoreInfo(coreInfo);

    setCoresHistory((prevHistory) => {
      const now = Date.now();
      return coreInfo.map((coreInfo) => {
        const existingCore = prevHistory.find(
          (core) => core.core_name === coreInfo.core_name
        );
        const newData = {
          timestamp: now,
          usage: coreInfo.core_usage,
          frequency: coreInfo.frequency,
        };

        if (existingCore) {
          return {
            ...existingCore,
            data: [...existingCore.data, newData].slice(-60), // Keep last 60 seconds
          };
        } else {
          return {
            core_name: coreInfo.core_name,
            data: [newData],
          };
        }
      });
    });
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
          <div className="flex gap-2 items-center">
            <Checkbox
              value={realtimeMode ? "on" : "off"}
              onClick={() => {
                setRealtimeMode(!realtimeMode);
              }}
            />{" "}
            <p className="text-sm text-muted-foreground">Overview mode</p>
          </div>
        </CardHeader>
        <CardContent>
          {realtimeMode ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={coreInfo}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="coreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="core_name" />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="core_usage"
                  stroke="#8884d8"
                  fill="url(#coreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {coresHistory.map((core) => (
                <div
                  key={core.core_name}
                  className="bg-white p-4 rounded-lg shadow overflow-hidden"
                >
                  <h3>{core.core_name}</h3>
                  <AreaChart
                    width={300}
                    height={200}
                    data={core.data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id={`coreGradient-${core.core_name}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8884d8"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="100%"
                          stopColor="#8884d8"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      // enable this for clock time
                      // tickFormatter={(unixTime) =>
                      //   new Date(unixTime).toLocaleTimeString()
                      // }
                      tickFormatter={(unixTime) => {
                        const seconds = Math.round(
                          (Date.now() - unixTime) / 1000
                        );
                        return seconds <= 60 ? `${60 - seconds}s` : "";
                      }}
                      tick={{ fontSize: 12 }}
                      ticks={[...Array(7)].map(
                        (_, i) => Date.now() - (60 - i * 10) * 1000
                      )}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      // enable this for clock time
                      // labelFormatter={(label) =>
                      //   new Date(label).toLocaleTimeString()
                      // }
                      labelFormatter={(unixTime) => {
                        const seconds = Math.round(
                          (Date.now() - unixTime) / 1000
                        );
                        return `${60 - seconds} seconds ago`;
                      }}
                      formatter={(value) => [
                        `${Number(value).toFixed(2)}%`,
                        "Usage",
                      ]}
                    />

                    <Area type="linear" dataKey={"usage"} />
                  </AreaChart>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
