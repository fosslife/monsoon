import {
  IconArrowDown,
  IconArrowUp,
  IconColumns3,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStream } from "@/hooks/use-stream";
import { formatBytes, formatDuration, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProcessInfo } from "@/types/system";

type SortKey = "pid" | "name" | "cpu_usage" | "memory";
type SortDirection = "asc" | "desc";

type Column = {
  id: string;
  label: string;
  sortKey?: SortKey;
  headerClassName?: string;
  cellClassName?: string;
  render: (process: ProcessInfo) => ReactNode;
};

const COLUMNS: Column[] = [
  {
    id: "pid",
    label: "PID",
    sortKey: "pid",
    headerClassName: "w-20",
    cellClassName: "stat-figure",
    render: (p) => p.pid,
  },
  {
    id: "name",
    label: "Name",
    sortKey: "name",
    cellClassName: "max-w-[220px] truncate font-medium",
    render: (p) => p.name,
  },
  {
    id: "cpu_usage",
    label: "CPU %",
    sortKey: "cpu_usage",
    headerClassName: "w-24 text-right",
    cellClassName: "stat-figure text-right",
    render: (p) => formatPercent(p.cpu_usage),
  },
  {
    id: "memory",
    label: "Memory",
    sortKey: "memory",
    headerClassName: "w-28 text-right",
    cellClassName: "stat-figure text-right",
    render: (p) => formatBytes(p.memory),
  },
  {
    id: "virtual_memory",
    label: "Virtual",
    headerClassName: "w-28 text-right",
    cellClassName: "stat-figure text-right",
    render: (p) => formatBytes(p.virtual_memory),
  },
  {
    id: "cmd",
    label: "Command",
    cellClassName: "max-w-[320px] truncate text-muted-foreground",
    render: (p) => p.cmd.join(" ") || p.exe || "—",
  },
  {
    id: "run_time",
    label: "Run time",
    headerClassName: "w-28",
    cellClassName: "stat-figure",
    render: (p) => formatDuration(p.run_time),
  },
  {
    id: "parent",
    label: "Parent",
    headerClassName: "w-20",
    cellClassName: "stat-figure",
    render: (p) => p.parent ?? "—",
  },
  {
    id: "status",
    label: "Status",
    headerClassName: "w-24",
    render: (p) => p.status,
  },
];

const DEFAULT_VISIBLE = ["pid", "name", "cpu_usage", "memory", "cmd"];

// Windows has no SIGTERM/SIGKILL distinction — the backend collapses both to a
// single terminate — so we hide the graceful/force choice there.
const isWindows = navigator.userAgent.includes("Windows");

function compareBy(a: ProcessInfo, b: ProcessInfo, key: SortKey): number {
  if (key === "name") return a.name.localeCompare(b.name);
  return a[key] - b[key];
}

/** Heat tint for CPU/memory cells; intensity tracks the metric. */
function heatCellStyle(
  columnId: string,
  process: ProcessInfo,
  maxMemory: number,
): React.CSSProperties | undefined {
  if (columnId === "cpu_usage" && process.cpu_usage > 0.5) {
    const strength = Math.min(55, process.cpu_usage * 0.55);
    return {
      backgroundColor: `color-mix(in oklab, var(--chart-1) ${strength.toFixed(0)}%, transparent)`,
    };
  }
  if (columnId === "memory" && maxMemory > 0) {
    const strength = Math.min(55, (process.memory / maxMemory) * 55);
    if (strength < 3) return undefined;
    return {
      backgroundColor: `color-mix(in oklab, var(--chart-2) ${strength.toFixed(0)}%, transparent)`,
    };
  }
  return undefined;
}

export const Processes = () => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    () => new Set(DEFAULT_VISIBLE),
  );
  const [sortKey, setSortKey] = useState<SortKey>("cpu_usage");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [paused, setPaused] = useState(false);
  const [killTarget, setKillTarget] = useState<ProcessInfo | null>(null);
  const [killError, setKillError] = useState<string | null>(null);
  // Snapshot of the row the user pressed, captured at pointer-down so a live
  // re-sort can't swap it out from under the click.
  const [selected, setSelected] = useState<ProcessInfo | null>(null);

  useStream<ProcessInfo[]>("processes", setProcesses, !paused);

  const deferredSearch = useDeferredValue(search);

  const rows = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    const filtered = needle
      ? processes.filter(
          (p) =>
            p.name.toLowerCase().includes(needle) ||
            (p.exe?.toLowerCase().includes(needle) ?? false) ||
            p.pid.toString().includes(needle) ||
            p.cmd.join(" ").toLowerCase().includes(needle),
        )
      : processes;
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => direction * compareBy(a, b, sortKey));
  }, [processes, deferredSearch, sortKey, sortDirection]);

  const maxMemory = useMemo(
    () => processes.reduce((max, p) => Math.max(max, p.memory), 0),
    [processes],
  );

  // Resolve the selected process from the live list so the drawer stays current
  // as the stream ticks; `undefined` means it has since exited.
  const processByPid = useMemo(() => {
    const map = new Map<number, ProcessInfo>();
    for (const p of processes) map.set(p.pid, p);
    return map;
  }, [processes]);

  // Prefer the live copy so the drawer keeps ticking; fall back to the
  // snapshot (and flag it) once the process exits.
  const liveSelected = selected
    ? (processByPid.get(selected.pid) ?? selected)
    : null;
  const selectedEnded = selected !== null && !processByPid.has(selected.pid);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const toggleColumn = (id: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const killProcess = async (force: boolean) => {
    if (!killTarget) return;
    try {
      await invoke("kill_process", { pid: killTarget.pid, force });
      setKillError(null);
    } catch (error) {
      setKillError(String(error));
    } finally {
      setKillTarget(null);
    }
  };

  const shownColumns = COLUMNS.filter((column) =>
    visibleColumns.has(column.id),
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Processes</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length === processes.length
            ? `${processes.length} processes`
            : `${rows.length} of ${processes.length} processes`}
          {paused && " · paused"}
        </p>
      </header>

      {killError && (
        <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{killError}</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-destructive hover:text-destructive"
            onClick={() => setKillError(null)}
            aria-label="Dismiss error"
          >
            <IconX className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          type="search"
          placeholder="Search by name, PID, or command…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Choose columns">
              <IconColumns3 className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Columns</DropdownMenuLabel>
            {COLUMNS.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={visibleColumns.has(column.id)}
                onCheckedChange={() => toggleColumn(column.id)}
                onSelect={(event) => event.preventDefault()}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          onClick={() => setPaused((prev) => !prev)}
          className="gap-2"
        >
          {paused ? (
            <IconPlayerPlay className="size-4" />
          ) : (
            <IconPlayerPause className="size-4" />
          )}
          {paused ? "Resume" : "Pause"}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              {shownColumns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn("whitespace-nowrap", column.headerClassName)}
                  aria-sort={
                    column.sortKey === sortKey
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {column.sortKey ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                      onClick={() => handleSort(column.sortKey as SortKey)}
                    >
                      {column.label}
                      {column.sortKey === sortKey &&
                        (sortDirection === "asc" ? (
                          <IconArrowUp className="size-3.5" />
                        ) : (
                          <IconArrowDown className="size-3.5" />
                        ))}
                    </button>
                  ) : (
                    <span className="font-semibold">{column.label}</span>
                  )}
                </TableHead>
              ))}
              <TableHead className="w-14 text-right font-semibold">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((process) => (
              <TableRow
                key={process.pid}
                className="cursor-pointer select-none text-xs odd:bg-muted/20 hover:bg-accent/40"
                onPointerDown={(event) => {
                  if (event.button === 0) setSelected(process);
                }}
              >
                {shownColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn("py-1.5", column.cellClassName)}
                    style={heatCellStyle(column.id, process, maxMemory)}
                    title={
                      column.id === "cmd"
                        ? process.cmd.join(" ") || (process.exe ?? undefined)
                        : undefined
                    }
                  >
                    {column.render(process)}
                  </TableCell>
                ))}
                <TableCell className="py-1.5 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      setKillTarget(process);
                    }}
                    aria-label={`Kill ${process.name}`}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={killTarget !== null}
        onOpenChange={(open) => {
          if (!open) setKillTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kill this process?</AlertDialogTitle>
            <AlertDialogDescription>
              {killTarget && (
                <>
                  <span className="font-medium text-foreground">
                    {killTarget.name}
                  </span>{" "}
                  (PID {killTarget.pid}) will be terminated.{" "}
                  {isWindows
                    ? "Unsaved work in that application may be lost."
                    : "Terminate asks it to shut down cleanly; force kill stops it immediately and unsaved work may be lost."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {isWindows ? (
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => void killProcess(true)}
              >
                Kill process
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => void killProcess(true)}
                >
                  Force kill
                </AlertDialogAction>
                <AlertDialogAction onClick={() => void killProcess(false)}>
                  Terminate
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet
        modal={false}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent
          overlay={false}
          // Non-modal: keep the drawer open while the list stays live, so
          // clicking another row swaps its contents instead of dismissing.
          onInteractOutside={(event) => event.preventDefault()}
          className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
        >
          {liveSelected && (
            <ProcessDetail
              process={liveSelected}
              ended={selectedEnded}
              processByPid={processByPid}
              onSelect={setSelected}
              onKill={() => {
                setKillTarget(liveSelected);
                setSelected(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

/** Ancestor list from a process up to the root, resolving names when live. */
function parentChain(
  process: ProcessInfo,
  processByPid: Map<number, ProcessInfo>,
): { pid: number; name: string | null }[] {
  const chain: { pid: number; name: string | null }[] = [];
  const seen = new Set<number>([process.pid]);
  let parent = process.parent;
  while (parent != null && !seen.has(parent)) {
    seen.add(parent);
    chain.push({ pid: parent, name: processByPid.get(parent)?.name ?? null });
    parent = processByPid.get(parent)?.parent ?? null;
  }
  return chain;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 py-2">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

function ProcessDetail({
  process,
  ended,
  processByPid,
  onSelect,
  onKill,
}: {
  process: ProcessInfo;
  ended: boolean;
  processByPid: Map<number, ProcessInfo>;
  onSelect: (process: ProcessInfo) => void;
  onKill: () => void;
}) {
  const chain = parentChain(process, processByPid);
  const commandLine = process.cmd.join(" ");

  return (
    <>
      <SheetHeader className="pr-8">
        <SheetTitle className="truncate">{process.name}</SheetTitle>
        <SheetDescription>
          PID {process.pid}
          {ended && " · no longer running"}
        </SheetDescription>
      </SheetHeader>

      <dl className="mt-4 divide-y divide-border">
        <DetailRow label="CPU">
          <span className="stat-figure">{formatPercent(process.cpu_usage)}</span>
        </DetailRow>
        <DetailRow label="Memory">
          <span className="stat-figure">{formatBytes(process.memory)}</span>
        </DetailRow>
        <DetailRow label="Virtual">
          <span className="stat-figure">
            {formatBytes(process.virtual_memory)}
          </span>
        </DetailRow>
        <DetailRow label="Status">{process.status}</DetailRow>
        <DetailRow label="Run time">
          <span className="stat-figure">{formatDuration(process.run_time)}</span>
        </DetailRow>
        <DetailRow label="Executable">
          {process.exe ? (
            <span className="break-all font-mono text-xs">{process.exe}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </DetailRow>
        <DetailRow label="Command">
          {commandLine ? (
            <span className="break-all font-mono text-xs">{commandLine}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </DetailRow>
        <DetailRow label="Parents">
          {chain.length ? (
            <ol className="flex flex-col gap-1">
              {chain.map((ancestor) => (
                <li key={ancestor.pid} className="flex items-center gap-2">
                  {processByPid.has(ancestor.pid) ? (
                    <button
                      type="button"
                      className="text-left hover:text-foreground hover:underline"
                      onClick={() => {
                        const live = processByPid.get(ancestor.pid);
                        if (live) onSelect(live);
                      }}
                    >
                      <span className="font-medium">
                        {ancestor.name ?? "—"}
                      </span>{" "}
                      <span className="stat-figure text-muted-foreground">
                        {ancestor.pid}
                      </span>
                    </button>
                  ) : (
                    <span className="text-muted-foreground">
                      {ancestor.name ?? "—"}{" "}
                      <span className="stat-figure">{ancestor.pid}</span>
                    </span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </DetailRow>
      </dl>

      <div className="mt-auto pt-6">
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive hover:text-destructive"
          onClick={onKill}
        >
          <IconTrash className="size-4" />
          Kill process
        </Button>
      </div>
    </>
  );
}
