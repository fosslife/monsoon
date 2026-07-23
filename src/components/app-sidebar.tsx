import {
  IconCpu,
  IconDatabase,
  IconDeviceSdCard,
  IconLayoutDashboard,
  IconListDetails,
  IconNetwork,
} from "@tabler/icons-react";
import { NavLink } from "react-router-dom";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: IconLayoutDashboard },
  { to: "/cpu", label: "CPU", icon: IconCpu },
  { to: "/memory", label: "Memory", icon: IconDeviceSdCard },
  { to: "/processes", label: "Processes", icon: IconListDetails },
  { to: "/disks", label: "Disks", icon: IconDatabase },
  { to: "/network", label: "Network", icon: IconNetwork },
];

export function AppSidebar() {
  return (
    <aside className="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md border-l-2 border-transparent px-2 py-1.5 text-sm transition-colors",
                isActive
                  ? "border-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <ThemeToggle />
      </div>
    </aside>
  );
}
