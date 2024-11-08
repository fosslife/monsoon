import { Channel, invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ListIcon, RefreshCcwIcon, Trash2Icon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { channel } from "diagnostics_channel";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";

type Process = {
  pid: number;
  name: string;
  cmd: string[];
  exe: string;
  cpu_usage: number;
  memory: number;
  parent: number;
  virtual_memory: number;
  status: string;
  run_time: number;
};

export const Processes = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [search, setSearch] = useState<string>("");
  const [colsToShow, setColsToShow] = useState<string[]>([
    "name",
    "pid",
    "cpu",
    "memory",
    "command",
  ]);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [sortType, setSortType] = useState<"memory" | "cpu" | "name" | "pid">(
    "cpu"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const onEvent = new Channel<Process[]>();
    onEvent.onmessage = (processes) => {
      setProcesses(sortProcesses(processes, sortType, sortDirection));
    };
    invoke("get_processes_info", { onEvent });

    return () => {
      emit("stop_processes_info");
    };
  }, [sortType, sortDirection]);

  const handleSort = (type: "memory" | "cpu" | "name" | "pid") => {
    if (type === sortType) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortType(type);
      setSortDirection("desc");
    }
  };

  const handleKill = (pid: number) => {
    invoke("kill_process", { pid });
  };

  console.log("render", processes[0]);

  return (
    <div>
      <div className="mb-4 flex space-x-2">
        <Input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Columns</DropdownMenuLabel>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Checkbox
                checked={colsToShow.includes("pid")}
                onClick={() => {
                  setColsToShow((prev) =>
                    prev.includes("pid")
                      ? prev.filter((col) => col !== "pid")
                      : [...prev, "pid"]
                  );
                }}
                className="w-4 h-4"
              />
              <span>PID</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Checkbox
                checked={colsToShow.includes("name")}
                onClick={() => {
                  setColsToShow((prev) =>
                    prev.includes("name")
                      ? prev.filter((col) => col !== "name")
                      : [...prev, "name"]
                  );
                }}
                className="w-4 h-4"
              />
              <span>Name</span>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Checkbox
                checked={colsToShow.includes("cpu")}
                onClick={() => {
                  setColsToShow((prev) =>
                    prev.includes("cpu")
                      ? prev.filter((col) => col !== "cpu")
                      : [...prev, "cpu"]
                  );
                }}
                className="w-4 h-4"
              />
              <span>CPU</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Checkbox
                checked={colsToShow.includes("memory")}
                onClick={() => {
                  setColsToShow((prev) =>
                    prev.includes("memory")
                      ? prev.filter((col) => col !== "memory")
                      : [...prev, "memory"]
                  );
                }}
                className="w-4 h-4"
              />
              <span>Memory</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Checkbox
                checked={colsToShow.includes("command")}
                onClick={() => {
                  setColsToShow((prev) =>
                    prev.includes("command")
                      ? prev.filter((col) => col !== "command")
                      : [...prev, "command"]
                  );
                }}
                className="w-4 h-4"
              />
              <span>Command</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Checkbox
                checked={colsToShow.includes("run_time")}
                onClick={() => {
                  setColsToShow((prev) =>
                    prev.includes("run_time")
                      ? prev.filter((col) => col !== "run_time")
                      : [...prev, "run_time"]
                  );
                }}
                className="w-4 h-4"
              />
              <span>Run Time</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Checkbox
                checked={colsToShow.includes("parent")}
                onClick={() => {
                  setColsToShow((prev) =>
                    prev.includes("parent")
                      ? prev.filter((col) => col !== "parent")
                      : [...prev, "parent"]
                  );
                }}
                className="w-4 h-4"
              />
              <span>Parent</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Checkbox
                checked={colsToShow.includes("virtual_memory")}
                onClick={() => {
                  setColsToShow((prev) =>
                    prev.includes("virtual_memory")
                      ? prev.filter((col) => col !== "virtual_memory")
                      : [...prev, "virtual_memory"]
                  );
                }}
                className="w-4 h-4"
              />
              <span>Virtual Memory</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          onClick={() => {
            console.log("pause");
            emit("stop_processes_info");
          }}
        >
          Pause
        </Button>
      </div>
      <Table>
        <TableHeader className="bg-gray-100 dark:bg-slate-700">
          <TableRow>
            {colsToShow.includes("pid") && (
              <TableHead
                className="font-bold cursor-pointer"
                onClick={() => handleSort("pid")}
              >
                <span className="flex items-center gap-1">
                  PID{" "}
                  {sortType === "pid" ? (
                    sortDirection === "asc" ? (
                      <IconArrowUp size={16} />
                    ) : (
                      <IconArrowDown size={16} />
                    )
                  ) : (
                    ""
                  )}
                </span>
              </TableHead>
            )}
            {colsToShow.includes("name") && (
              <TableHead
                className="font-bold cursor-pointer"
                onClick={() => handleSort("name")}
              >
                <span className="flex items-center gap-1">
                  Name{" "}
                  {sortType === "name" ? (
                    sortDirection === "asc" ? (
                      <IconArrowUp size={16} />
                    ) : (
                      <IconArrowDown size={16} />
                    )
                  ) : (
                    ""
                  )}
                </span>
              </TableHead>
            )}
            {colsToShow.includes("cpu") && (
              <TableHead
                className="font-bold cursor-pointer"
                onClick={() => handleSort("cpu")}
              >
                <span className="flex items-center gap-1">
                  CPU{" "}
                  {sortType === "cpu" ? (
                    sortDirection === "asc" ? (
                      <IconArrowUp size={16} />
                    ) : (
                      <IconArrowDown size={16} />
                    )
                  ) : (
                    ""
                  )}
                </span>
              </TableHead>
            )}
            {colsToShow.includes("memory") && (
              <TableHead
                className="font-bold cursor-pointer"
                onClick={() => handleSort("memory")}
              >
                <span className="flex items-center gap-1">
                  Memory{" "}
                  {sortType === "memory" ? (
                    sortDirection === "asc" ? (
                      <IconArrowUp size={16} />
                    ) : (
                      <IconArrowDown size={16} />
                    )
                  ) : (
                    ""
                  )}
                </span>
              </TableHead>
            )}
            {colsToShow.includes("command") && (
              <TableHead className="font-bold">
                <span>Command</span>
              </TableHead>
            )}
            {colsToShow.includes("run_time") && (
              <TableHead className="font-bold">
                <span>Run Time</span>
              </TableHead>
            )}
            {colsToShow.includes("parent") && (
              <TableHead className="font-bold">
                <span>Parent</span>
              </TableHead>
            )}
            {colsToShow.includes("virtual_memory") && (
              <TableHead className="font-bold">
                <span>Virtual Memory</span>
              </TableHead>
            )}
            <TableHead className="font-bold">Kill</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processes
            .filter(
              (process) =>
                process.name.toLowerCase().includes(search.toLowerCase()) ||
                process.exe.toLowerCase().includes(search.toLowerCase()) ||
                process.pid.toString().includes(search)
            )
            .map((process) => (
              <TableRow key={process.pid}>
                {colsToShow.includes("pid") && (
                  <TableCell>{process.pid}</TableCell>
                )}
                {colsToShow.includes("name") && (
                  <TableCell>{process.name}</TableCell>
                )}
                {colsToShow.includes("cpu") && (
                  <TableCell>{Number(process.cpu_usage).toFixed(2)}%</TableCell>
                )}
                {colsToShow.includes("memory") && (
                  <TableCell>{formatSize(process.memory)}</TableCell>
                )}
                {colsToShow.includes("command") && (
                  <TableCell
                    className="max-w-[200px] truncate"
                    title={process.cmd.join(" ")}
                  >
                    {process.cmd.join(" ")}
                  </TableCell>
                )}
                {colsToShow.includes("run_time") && (
                  <TableCell>{formatTime(process.run_time)}</TableCell>
                )}
                {colsToShow.includes("parent") && (
                  <TableCell>{process.parent}</TableCell>
                )}
                {colsToShow.includes("virtual_memory") && (
                  <TableCell>{formatSize(process.virtual_memory)}</TableCell>
                )}
                <TableCell>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleKill(process.pid)}
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

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

function sortProcesses(
  processes: Process[],
  sortType: "memory" | "cpu" | "name" | "pid",
  direction: "asc" | "desc"
): Process[] {
  const sortedProcesses = [...processes].sort((a, b) => {
    switch (sortType) {
      case "memory":
        return b.memory - a.memory;
      case "cpu":
        return b.cpu_usage - a.cpu_usage;
      case "name":
        return a.name.localeCompare(b.name);
      case "pid":
        return a.pid - b.pid;
    }
  });

  return direction === "asc" ? sortedProcesses.reverse() : sortedProcesses;
}
