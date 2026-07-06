"use client";

import { cn } from "@/lib/utils";
import { NavLinks } from "@/components/nav-links";
import { useSidebarState, SidebarLogoButton } from "@/components/sidebar-toggle";

export function Sidebar() {
  const { collapsed, mobileOpen, closeMobile } = useSidebarState();

  return (
    <>
      {/* Desktop / tablet: persistent rail, collapses to icons. The logo itself is
          the collapse toggle (see SidebarLogoButton). */}
      <aside
        className={cn(
          "vibrancy hidden shrink-0 flex-col border-r border-border transition-[width] duration-150 md:flex",
          collapsed ? "w-[64px]" : "w-[220px]",
        )}
      >
        <div className="py-5">
          <SidebarLogoButton collapsed={collapsed} />
        </div>
        <NavLinks collapsed={collapsed} />
      </aside>

      {/* Mobile: off-canvas slide-over. No collapse state here — it's either open
          or closed, so the logo is just a static header, not a toggle. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={closeMobile} />
          <aside className="vibrancy fixed inset-y-0 left-0 flex w-[240px] flex-col border-r border-border">
            <div className="flex items-center justify-between px-4 py-5">
              <div className="flex items-center gap-2">
                <img src="/logo_only_black.png" alt="" width={24} height={24} className="dark:invert" />
                <span className="text-[17px] font-semibold text-text-primary">RepairX</span>
              </div>
              <button
                onClick={closeMobile}
                aria-label="Close menu"
                className="rounded-full p-1.5 text-text-secondary hover:bg-surface"
              >
                ✕
              </button>
            </div>
            <div onClick={closeMobile}>
              <NavLinks />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
