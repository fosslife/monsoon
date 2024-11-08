import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Navbar } from "./components/navbar/Navbar";
import { Routes, Route } from "react-router-dom";
import { Home } from "./pages/home";
import { CPU } from "./pages/cpu";
import { Memory } from "./pages/memory";
import { Processes } from "./pages/processes";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider>
      <div className="h-full">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel maxSize={16}>
            <Navbar />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <div className="h-full p-3 overflow-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cpu" element={<CPU />} />
                <Route path="/memory" element={<Memory />} />
                <Route path="/process" element={<Processes />} />
              </Routes>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ThemeProvider>
  );
}

export default App;
