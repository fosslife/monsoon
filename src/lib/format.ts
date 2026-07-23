const BYTE_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"] as const;

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const exponent = Math.min(
    Math.floor(Math.log2(bytes) / 10),
    BYTE_UNITS.length - 1,
  );
  return `${(bytes / 1024 ** exponent).toFixed(decimals)} ${BYTE_UNITS[exponent]}`;
}

export function formatPercent(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(decimals)}%`;
}

export function formatFrequency(mhz: number): string {
  if (!Number.isFinite(mhz) || mhz <= 0) return "—";
  return mhz >= 1000 ? `${(mhz / 1000).toFixed(2)} GHz` : `${mhz} MHz`;
}

/** "3d 4h 5m 6s" with leading zero units omitted. */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "—";
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

export function formatUnixTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString();
}
