"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type QuadrantTheme =
  | "default"
  | "systems"
  | "ai"
  | "finance"
  | "fullstack";

interface AccentColorContextType {
  currentTheme: QuadrantTheme;
  setTheme: (theme: QuadrantTheme) => void;
}

const AccentColorContext = createContext<AccentColorContextType | undefined>(
  undefined
);

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<QuadrantTheme>("default");

  return (
    <AccentColorContext.Provider
      value={{ currentTheme, setTheme: setCurrentTheme }}
    >
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  const context = useContext(AccentColorContext);
  if (context === undefined) {
    throw new Error(
      "useAccentColor must be used within an AccentColorProvider"
    );
  }
  return context;
}
