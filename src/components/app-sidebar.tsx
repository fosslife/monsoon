import {
  IconCloudBolt,
  IconCpu,
  IconDeviceSdCard,
  IconLayoutDashboard,
  IconListDetails,
} from "@tabler/icons-react";
import { NavLink } from "react-router-dom";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: IconLayoutDashboard },
  { to: "/cpu", label: "CPU", icon: IconCpu },
  { to: "/memory", label: "Memory", icon: IconDeviceSdCard },
  { to: "/processes", label: "Processes", icon: IconListDetails },
];

export function AppSidebar() {
  return (
    <aside className="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-4">
        <IconCloudBolt className="size-5 text-primary" aria-hidden />
        <span className="text-sm font-semibold tracking-widest uppercase">
          Monsoon
        </span>
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
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
