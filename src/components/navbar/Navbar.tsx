import { IconHome, IconCpu, IconChartPie, IconList } from "@tabler/icons-react";
import clsx from "clsx";
import { useLocation, useNavigate } from "react-router-dom";

const routes = [
  {
    id: "home",
    to: "/",
    label: "Home",
    icon: <IconHome />,
  },
  {
    id: "cpu",
    to: "/cpu",
    label: "CPU",
    icon: <IconChartPie />,
  },
  {
    id: "memory",
    to: "/memory",
    label: "Memory",
    icon: <IconCpu />,
  },
  {
    id: "process",
    to: "/process",
    label: "Processes",
    icon: <IconList />,
  },
];

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const handleClick = (to: string) => {
    navigate(to);
  };

  return (
    <div className="flex flex-col gap-0 bg-slate-100 h-full ">
      {routes.map((route) => (
        <div
          onClick={() => handleClick(route.to)}
          key={route.id}
          className={clsx(
            "flex gap-2 text-sm items-center cursor-pointer p-3 pl-2 select-none",
            {
              "text-gray-950 bg-slate-200": location.pathname === route.to,
              "text-slate-800": location.pathname !== route.to,
            }
          )}
        >
          <div>{route.icon}</div>
          <div>{route.label}</div>
        </div>
      ))}
    </div>
  );
};
