import { createTheme, type Theme } from "@mui/material/styles";

// Mirrors DESIGN.md's color table exactly — MUI needs a real JS theme object (not
// CSS custom properties) to theme Card/Chart internals, so these values are
// duplicated here rather than read from globals.css. If DESIGN.md's palette changes,
// both places need updating.
const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif';

const TOKENS = {
  light: {
    canvas: "#f5f5f7",
    surfaceSolid: "#ffffff",
    textPrimary: "#1d1d1f",
    textSecondary: "#6e6e73",
    border: "rgba(0,0,0,0.08)",
    accent: "#0071e3",
    accentBg: "rgba(0,113,227,0.12)",
  },
  dark: {
    canvas: "#1c1c1e",
    surfaceSolid: "#2c2c2e",
    textPrimary: "#f5f5f7",
    textSecondary: "#98989d",
    border: "rgba(255,255,255,0.10)",
    accent: "#409cff",
    accentBg: "rgba(64,156,255,0.16)",
  },
} as const;

// Status palette (order/shift-entry state) — semantic only, closed set of 5 hues per
// DESIGN.md; used by chart series that plot status breakdowns.
export const STATUS_COLORS = {
  light: { open: "#8e8e93", progress: "#0071e3", closed: "#248a3d", waiting: "#a05a00", urgent: "#d70015" },
  dark: { open: "#98989d", progress: "#409cff", closed: "#30d158", waiting: "#ffb340", urgent: "#ff453a" },
} as const;

// Categorical UIC palette (10 hues, one per unit-in-charge team) — see wc-uic-map.ts
// for the work-center-to-UIC mapping this colors. Order matches uic-a..uic-j.
export const UIC_COLORS = {
  light: ["#7c3aed", "#ea580c", "#0d9488", "#db2777", "#0891b2", "#65a30d", "#b45309", "#475569", "#9f1239", "#166534"],
  dark: ["#a78bfa", "#fb923c", "#2dd4bf", "#f472b6", "#22d3ee", "#a3e635", "#fbbf24", "#94a3b8", "#fda4af", "#86efac"],
} as const;

export function createAppTheme(mode: "light" | "dark"): Theme {
  const t = TOKENS[mode];
  return createTheme({
    palette: {
      mode,
      primary: { main: t.accent },
      background: { default: t.canvas, paper: t.surfaceSolid },
      text: { primary: t.textPrimary, secondary: t.textSecondary },
      divider: t.border,
    },
    typography: {
      fontFamily: FONT_STACK,
      // DESIGN.md: "Don't use uppercase tracked type anywhere" — MUI's Button
      // defaults to uppercase; this and the MuiButton override below both disable it.
      button: { textTransform: "none" },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          // Opaque, not vibrancy — DESIGN.md's Level-2 rule for any surface sitting
          // over content/data rather than bare canvas (an earlier iteration blurred
          // dialogs/cards over content and it read as muddy). Chrome-only surfaces
          // (sidebar/topbar) keep their own vibrancy via the existing .vibrancy class
          // and are not MUI components.
          root: {
            backgroundColor: t.surfaceSolid,
            backgroundImage: "none",
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            boxShadow: "none",
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: { padding: 20, "&:last-child": { paddingBottom: 20 } },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: "none", borderRadius: 999 },
        },
      },
    },
  });
}
