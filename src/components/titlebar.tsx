import {
  IconCloudBolt,
  IconMinus,
  IconSquare,
  IconX,
} from "@tabler/icons-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { Button } from "@/components/ui/button";

/**
 * Custom window chrome for the frameless window (`decorations: false`).
 * The bar is a Tauri drag region; double-click toggles maximize natively.
 */
export function Titlebar() {
  const appWindow = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="flex h-9 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar pl-3 select-none"
    >
      <div
        data-tauri-drag-region
        className="pointer-events-none flex items-center gap-2 text-sidebar-foreground"
      >
        <IconCloudBolt className="size-4 text-primary" aria-hidden />
        <span className="text-xs font-semibold tracking-widest uppercase">
          Monsoon
        </span>
      </div>
      <div className="flex h-full">
        <Button
          variant="ghost"
          size="icon"
          className="h-full w-11 rounded-none text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => void appWindow.minimize()}
          aria-label="Minimize window"
        >
          <IconMinus className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-full w-11 rounded-none text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => void appWindow.toggleMaximize()}
          aria-label="Maximize window"
        >
          <IconSquare className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-full w-11 rounded-none text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => void appWindow.close()}
          aria-label="Close window"
        >
          <IconX className="size-4" />
        </Button>
      </div>
    </div>
  );
}
