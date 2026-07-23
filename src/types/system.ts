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

export type TopProcess = {
  pid: number;
  name: string;
  cpu_usage: number;
  memory: number;
};

/** Aggregate snapshot for the dashboard and status footer; rates are bytes/sec. */
export type OverviewSnapshot = {
  cpu_global: number;
  core_usages: number[];
  mem_total: number;
  mem_used: number;
  swap_total: number;
  swap_used: number;
  process_count: number;
  top_processes: TopProcess[];
  net_rx: number;
  net_tx: number;
  disk_read: number;
  disk_write: number;
};

export type DiskInfo = {
  name: string;
  mount_point: string;
  file_system: string;
  kind: string;
  total_space: number;
  available_space: number;
  removable: boolean;
  /** Bytes/sec since the previous refresh. */
  read_rate: number;
  write_rate: number;
};

export type NetworkInfo = {
  name: string;
  /** Bytes/sec since the previous refresh. */
  received_rate: number;
  transmitted_rate: number;
  total_received: number;
  total_transmitted: number;
};

/** Mirrors the `StreamName` enum in `src-tauri/src/streams.rs`. */
export type StreamName =
  "cpu" | "memory" | "processes" | "overview" | "disks" | "networks";
