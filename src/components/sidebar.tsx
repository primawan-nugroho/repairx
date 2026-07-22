"use client";

import { cn } from "@/lib/utils";
import { NavLinks } from "@/components/nav-links";
import { useSidebarState, SidebarLogoButton } from "@/components/sidebar-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { AvatarMenu } from "@/components/avatar-menu";

interface SidebarProps {
  name: string;
  role: string;
  username: string;
  avatarSvg: string;
}

export function Sidebar({ name, role, username, avatarSvg }: SidebarProps) {
  const { collapsed, mobileOpen, closeMobile } = useSidebarState();

  return (
    <>
      {/* Desktop / tablet: persistent rail, collapses to icons. The logo itself is
          the collapse toggle (see SidebarLogoButton). */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col overflow-hidden border-r border-border transition-[width] duration-150 md:flex",
          collapsed ? "vibrancy w-[64px]" : "bg-sidebar w-[220px]",
        )}
      >
        <div className="py-5">
          <SidebarLogoButton collapsed={collapsed} />
        </div>
        <NavLinks collapsed={collapsed} />

        <div className="flex flex-col gap-1 border-t border-border p-3">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
            {!collapsed && <span className="text-sm text-text-secondary">Switch theme</span>}
            <ThemeToggle />
          </div>
          <AvatarMenu avatarSvg={avatarSvg} name={name} role={role} username={username} variant="sidebar" collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile: off-canvas slide-over. No collapse state here — it's either open
          or closed, so the logo is just a static header, not a toggle. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={closeMobile} />
          <aside className="bg-sidebar fixed inset-y-0 left-0 flex w-[240px] flex-col border-r border-border">
            <div className="flex items-center justify-between px-4 py-5">
              <div className="flex items-center gap-2">
                <img src="/logo_only_black.png" alt="" width={24} height={24} className="dark:invert" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-[16px] font-semibold text-text-primary">RepairX</span>
                  <span className="text-[10px] text-text-secondary">Repair Production Control</span>
                </span>
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

            <div className="flex flex-col gap-1 border-t border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Switch theme</span>
                <ThemeToggle />
              </div>
              <AvatarMenu avatarSvg={avatarSvg} name={name} role={role} username={username} variant="sidebar" />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
