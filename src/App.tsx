import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppSidebar } from "@/components/app-sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// Route-level code splitting keeps recharts out of the initial chunk.
const Home = lazy(() =>
  import("@/pages/home").then((m) => ({ default: m.Home })),
);
const CPU = lazy(() => import("@/pages/cpu").then((m) => ({ default: m.CPU })));
const Memory = lazy(() =>
  import("@/pages/memory").then((m) => ({ default: m.Memory })),
);
const Processes = lazy(() =>
  import("@/pages/processes").then((m) => ({ default: m.Processes })),
);

function App() {
  return (
    <ThemeProvider>
      <ResizablePanelGroup orientation="horizontal">
        {/* v4: numeric sizes are pixels, percentage sizes must be strings */}
        <ResizablePanel defaultSize="15%" minSize={150} maxSize="24%">
          <AppSidebar />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          <main className="h-full overflow-auto p-4">
            <ErrorBoundary>
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/cpu" element={<CPU />} />
                  <Route path="/memory" element={<Memory />} />
                  <Route path="/processes" element={<Processes />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </ThemeProvider>
  );
}

export default App;
