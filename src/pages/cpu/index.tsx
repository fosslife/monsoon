import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { invoke, Channel } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

type CPUInfo = {
  cpu_name: string;
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
  const onEvent = new Channel<CoreInfo>();

  onEvent.onmessage = (message) => {
    console.log("EVENT: ", message);
  };

  useEffect(() => {
    invoke<CPUInfo>("get_cpu_info", { onEvent }).then((res) => {
      setCpuInfo(res);
    });

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
        </CardHeader>
        <CardContent></CardContent>
      </Card>
    </div>
  );
};
