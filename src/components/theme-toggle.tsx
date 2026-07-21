"use client";

import { useThemeMode } from "./theme-provider";

export function ThemeToggle() {
  const { mode, mounted, toggle } = useThemeMode();

  if (!mounted) return <div className="h-8 w-8" aria-hidden />;

  return (
    <button
      onClick={toggle}
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-sm text-text-primary"
    >
      {mode === "dark" ? "☀︎" : "☾"}
    </button>
  );
}
