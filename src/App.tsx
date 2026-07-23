import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppSidebar } from "@/components/app-sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { MetricsProvider } from "@/components/metrics-provider";
import { StatusFooter } from "@/components/status-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Titlebar } from "@/components/titlebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// Route-level code splitting keeps recharts out of the initial chunk.
const Dashboard = lazy(() =>
  import("@/pages/dashboard").then((m) => ({ default: m.Dashboard })),
);
const CPU = lazy(() => import("@/pages/cpu").then((m) => ({ default: m.CPU })));
const Memory = lazy(() =>
  import("@/pages/memory").then((m) => ({ default: m.Memory })),
);
const Processes = lazy(() =>
  import("@/pages/processes").then((m) => ({ default: m.Processes })),
);
const Disks = lazy(() =>
  import("@/pages/disks").then((m) => ({ default: m.Disks })),
);
const Network = lazy(() =>
  import("@/pages/network").then((m) => ({ default: m.Network })),
);

function App() {
  return (
    <ThemeProvider>
      <MetricsProvider>
        <div className="flex h-full flex-col">
          <Titlebar />
          <div className="min-h-0 flex-1">
            <ResizablePanelGroup orientation="horizontal">
              {/* v4: numeric sizes are pixels, percentage sizes must be strings */}
              <ResizablePanel defaultSize="15%" minSize={150} maxSize="24%">
                <AppSidebar />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel>
                <main className="h-full overflow-auto p-3">
                  <ErrorBoundary>
                    <Suspense fallback={null}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/cpu" element={<CPU />} />
                        <Route path="/memory" element={<Memory />} />
                        <Route path="/processes" element={<Processes />} />
                        <Route path="/disks" element={<Disks />} />
                        <Route path="/network" element={<Network />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </main>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
          <StatusFooter />
        </div>
      </MetricsProvider>
    </ThemeProvider>
  );
}

export default App;
