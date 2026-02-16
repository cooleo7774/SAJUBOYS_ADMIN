import { createContext, useContext, type ReactNode } from "react";
import { useAdminStudioState, type AdminStudioState } from "../../hooks/useAdminStudio";

const StudioContext = createContext<AdminStudioState | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const value = useAdminStudioState();
  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): AdminStudioState {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("useStudio must be used within StudioProvider");
  }
  return context;
}
