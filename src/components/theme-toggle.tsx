import {
  IconDeviceDesktop,
  IconMoonStars,
  IconSunHigh,
} from "@tabler/icons-react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

const MODES = [
  { value: "light", label: "Light", icon: IconSunHigh },
  { value: "dark", label: "Dark", icon: IconMoonStars },
  { value: "system", label: "System", icon: IconDeviceDesktop },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const index = MODES.findIndex((mode) => mode.value === theme);
  const current = MODES[index] ?? MODES[2];
  const next = MODES[(index + 1) % MODES.length];

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      onClick={() => setTheme(next.value)}
      title={`Switch to ${next.label.toLowerCase()} theme`}
    >
      <current.icon className="size-4" />
      <span className="text-xs">{current.label} theme</span>
    </Button>
  );
}
