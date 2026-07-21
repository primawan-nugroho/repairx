"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { createAppTheme } from "@/lib/mui-theme";

type Mode = "light" | "dark";

interface ThemeModeContextValue {
  mode: Mode;
  /** False until the client has read the real persisted theme off `<html
   * data-theme>` — lets consumers (ThemeToggle) avoid flashing the wrong icon before
   * that first read completes, same guard the toggle used before this provider
   * existed. */
  mounted: boolean;
  toggle: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeModeProvider");
  return ctx;
}

/** Single source of truth for the app's light/dark theme, feeding both the existing
 * DOM-attribute-driven CSS (`[data-theme]` in globals.css, unchanged) and MUI's
 * `createTheme({ palette: { mode } })` (which needs a real JS value, not a CSS
 * variable). The root `<html>` script in app/layout.tsx already sets `data-theme`
 * before paint to avoid a flash for the Tailwind-styled app shell; this provider
 * mirrors that value into React state on mount, then becomes what ThemeToggle reads
 * and writes through instead of touching the DOM directly. */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setMode(current === "dark" ? "dark" : "light");
    setMounted(true);
  }, []);

  function toggle() {
    setMode((prev) => {
      const next: Mode = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("repairx-theme", next);
      return next;
    });
  }

  return (
    <ThemeModeContext.Provider value={{ mode, mounted, toggle }}>
      <AppRouterCacheProvider options={{ key: "mui" }}>
        <MuiThemeProvider theme={createAppTheme(mode)}>{children}</MuiThemeProvider>
      </AppRouterCacheProvider>
    </ThemeModeContext.Provider>
  );
}
