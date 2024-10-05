import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableCellBold,
  TableRow,
} from "@/components/ui/table";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

type SystemInfo = {
  os_name: string;
  os_version: string;
  os_kernel_version: string;
  hostname: string;
  boot_time: number;
  distribution_id: string;
  cpu_arch: string;
  uptime: number;
};

export const Home = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);

  useEffect(() => {
    invoke<SystemInfo>("get_system_info").then((res) => {
      setSystemInfo(res);
      setUptime(res.uptime);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime((prev) => (prev || 0) + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCellBold>OS Name</TableCellBold>
                <TableCell>{systemInfo?.os_name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCellBold>OS Version</TableCellBold>
                <TableCell>{systemInfo?.os_version}</TableCell>
              </TableRow>
              <TableRow>
                <TableCellBold>OS Kernel Version</TableCellBold>
                <TableCell>{systemInfo?.os_kernel_version}</TableCell>
              </TableRow>
              <TableRow>
                <TableCellBold>Hostname</TableCellBold>
                <TableCell>{systemInfo?.hostname}</TableCell>
              </TableRow>
              <TableRow>
                <TableCellBold>Boot Time</TableCellBold>
                <TableCell>
                  {bootTimeFromSeconds(systemInfo?.boot_time || 0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCellBold>Uptime</TableCellBold>
                <TableCell>{secondsToHumanTime(uptime || 0)}</TableCell>
              </TableRow>

              <TableRow>
                <TableCellBold>Distribution ID</TableCellBold>
                <TableCell>{systemInfo?.distribution_id}</TableCell>
              </TableRow>
              <TableRow>
                <TableCellBold>CPU Architecture</TableCellBold>
                <TableCell>{systemInfo?.cpu_arch}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

function secondsToHumanTime(seconds: number) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function bootTimeFromSeconds(seconds: number) {
  const date = new Date(seconds * 1000);

  // intl format it and return

  return date.toLocaleString();
}
