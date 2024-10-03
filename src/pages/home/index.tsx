import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

type SystemInfo = {
  os_name: string;
  os_version: string;
  os_kernel_version: string;
  hostname: string;
  boot_time: string;
  distribution_id: string;
  cpu_arch: string;
};

export const Home = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    invoke<SystemInfo>("get_system_info").then((res) => {
      setSystemInfo(res);
    });
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
                <TableCell>OS Name</TableCell>
                <TableCell>{systemInfo?.os_name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>OS Version</TableCell>
                <TableCell>{systemInfo?.os_version}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>OS Kernel Version</TableCell>
                <TableCell>{systemInfo?.os_kernel_version}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Hostname</TableCell>
                <TableCell>{systemInfo?.hostname}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Boot Time</TableCell>
                <TableCell>{systemInfo?.boot_time}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Distribution ID</TableCell>
                <TableCell>{systemInfo?.distribution_id}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>CPU Architecture</TableCell>
                <TableCell>{systemInfo?.cpu_arch}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
