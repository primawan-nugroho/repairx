import type { Metadata } from "next";
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
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
