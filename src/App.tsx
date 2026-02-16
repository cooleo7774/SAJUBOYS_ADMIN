import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "./components/admin/AdminShell";
import { StudioProvider } from "./components/studio/StudioContext";
import { KnowledgeBlockEditor } from "./routes/KnowledgeBlockEditor";
import { KnowledgeLibrary } from "./routes/KnowledgeLibrary";
import { Dashboard } from "./routes/admin/Dashboard";
import { DeployManager } from "./routes/admin/DeployManager";
import { Generator } from "./routes/admin/Generator";
import { ProductList } from "./routes/admin/ProductList";
import { ProductSettings } from "./routes/admin/ProductSettings";

export function App() {
  return (
    <BrowserRouter>
      <StudioProvider>
        <Routes>
          <Route path="/" element={<AdminShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="knowledge" element={<KnowledgeLibrary />} />
            <Route path="knowledge/:blockId" element={<KnowledgeBlockEditor />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/:productId" element={<ProductSettings />} />
            <Route path="generator" element={<Generator />} />
            <Route path="deploy" element={<DeployManager />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </StudioProvider>
    </BrowserRouter>
  );
}
