"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface TopNavExtras {
  lastUpdated?: string;
  showLive?: boolean;
  onRefresh?: () => void;
}

interface TopNavExtrasCtx {
  extras: TopNavExtras;
  setExtras: (e: TopNavExtras) => void;
  clearExtras: () => void;
}

const TopNavExtrasContext = createContext<TopNavExtrasCtx>({
  extras: {},
  setExtras: () => {},
  clearExtras: () => {},
});

export function TopNavExtrasProvider({ children }: { children: ReactNode }) {
  const [extras, setExtrasState] = useState<TopNavExtras>({});

  const setExtras = useCallback((e: TopNavExtras) => {
    setExtrasState(e);
  }, []);

  const clearExtras = useCallback(() => {
    setExtrasState({});
  }, []);

  return (
    <TopNavExtrasContext.Provider value={{ extras, setExtras, clearExtras }}>
      {children}
    </TopNavExtrasContext.Provider>
  );
}

export function useTopNavExtras() {
  return useContext(TopNavExtrasContext);
}
