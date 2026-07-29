import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'lowDataMode';

const LowDataContext = createContext<{ lowData: boolean; toggleLowData: () => void } | null>(null);

export function LowDataProvider({ children }: { children: React.ReactNode }) {
  const [lowData, setLowData] = useState<boolean>(() => localStorage.getItem(STORAGE_KEY) === 'true');

  function toggleLowData() {
    setLowData((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return <LowDataContext.Provider value={{ lowData, toggleLowData }}>{children}</LowDataContext.Provider>;
}

export function useLowData() {
  const ctx = useContext(LowDataContext);
  if (!ctx) throw new Error('useLowData must be used within a LowDataProvider');
  return ctx;
}
