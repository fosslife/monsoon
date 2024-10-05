import { Channel, invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";

type MemInfo = {
  total: number;
  free: number;
  available: number;
  buffers: number;
  cached: number;
  swap_total: number;
  swap_free: number;
};

export const Memory = () => {
  const onEvent = new Channel<MemInfo[]>();

  onEvent.onmessage = (mem) => {
    console.log("mem", mem);
  };

  useEffect(() => {
    invoke("get_memory_info", { onEvent });
  }, []);

  return <div>Memory</div>;
};
