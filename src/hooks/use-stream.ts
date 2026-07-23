import { Channel, invoke } from "@tauri-apps/api/core";
import { useEffect, useRef } from "react";

import type { StreamName } from "@/types/system";

const STREAM_COMMANDS: Record<StreamName, string> = {
  cpu: "get_cpu_info",
  memory: "get_memory_info",
  processes: "get_processes_info",
};

/**
 * Subscribes to a backend sampling stream for the lifetime of the component.
 *
 * The backend cancels any previous stream with the same name when a new one
 * starts, and the returned cleanup stops sampling on unmount, so remounts
 * (including StrictMode double-mounts) can never leak a sampling loop.
 */
export function useStream<T>(
  stream: StreamName,
  onData: (data: T) => void,
  enabled = true,
) {
  const handler = useRef(onData);

  useEffect(() => {
    handler.current = onData;
  }, [onData]);

  useEffect(() => {
    if (!enabled) return;

    const channel = new Channel<T>();
    channel.onmessage = (data) => handler.current(data);
    invoke(STREAM_COMMANDS[stream], { onEvent: channel }).catch(
      (error: unknown) => {
        console.error(`stream "${stream}" failed`, error);
      },
    );

    return () => {
      void invoke("stop_stream", { stream });
    };
  }, [stream, enabled]);
}
