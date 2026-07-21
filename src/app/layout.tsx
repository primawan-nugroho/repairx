import type { Metadata } from "next";
import { ThemeModeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepairX",
  description: "Aviation MRO part repair monitoring dashboard",
};

// Runs before paint to avoid a flash of the wrong theme: reads the persisted choice,
// falls back to the OS preference on first visit.
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem("repairx-theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // The pre-paint script below mutates data-theme on this element before React
    // hydrates (the standard no-flash-of-wrong-theme technique) — React's hydration
    // diff would otherwise flag that attribute as a server/client mismatch on every
    // load, since its own render output never includes data-theme at all.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeModeProvider>{children}</ThemeModeProvider>
      </body>
    </html>
  );
}
