import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Navbar } from "./components/navbar/Navbar";
import { Routes, Route } from "react-router-dom";
import { Home } from "./pages/home";
import { CPU } from "./pages/cpu";

function App() {
  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={12} maxSize={16}>
          <Navbar />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          <div className="h-full p-3 overflow-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cpu" element={<CPU />} />
            </Routes>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default App;
