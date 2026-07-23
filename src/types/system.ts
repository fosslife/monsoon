/**
 * Payload types for the Tauri IPC boundary.
 * Each type mirrors a `Serialize` struct in `src-tauri/src/`.
 */

export type SystemInfo = {
  os_name: string;
  os_version: string;
  os_kernel_version: string;
  hostname: string;
  boot_time: number;
  distribution_id: string;
  cpu_arch: string;
  uptime: number;
};

export type CacheInfo = {
  label: string;
  bytes: number;
};

export type CpuStatic = {
  brand: string;
  physical_cores: number;
  logical_cores: number;
  cache_sizes: CacheInfo[];
  features: string[];
};

export type CoreSnapshot = {
  name: string;
  usage: number;
  /** Current frequency in MHz. */
  frequency: number;
};

export type CpuSnapshot = {
  global_usage: number;
  cores: CoreSnapshot[];
};

export type MemorySnapshot = {
  total: number;
  used: number;
  free: number;
  available: number;
  swap_total: number;
  swap_used: number;
  swap_free: number;
};

export type ProcessInfo = {
  pid: number;
  name: string;
  cmd: string[];
  exe: string | null;
  cpu_usage: number;
  memory: number;
  virtual_memory: number;
  run_time: number;
  parent: number | null;
  status: string;
};

/** Mirrors the `StreamName` enum in `src-tauri/src/streams.rs`. */
export type StreamName = "cpu" | "memory" | "processes";
