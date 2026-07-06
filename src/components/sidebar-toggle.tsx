"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "repairx-sidebar-collapsed";
const TOGGLE_EVENT = "repairx-sidebar-toggle";
const MOBILE_EVENT = "repairx-sidebar-mobile";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
}

/** Shared sidebar state (desktop collapse + mobile slide-over) between the topbar
 * hamburger button and the sidebar itself, coordinated via custom DOM events rather
 * than React context since both mount as siblings under the same client boundary. */
export function useSidebarState() {
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCollapsedState(readCollapsed());
    setMounted(true);
    function onToggle() {
      setCollapsedState(readCollapsed());
    }
    function onMobile(e: Event) {
      setMobileOpen((e as CustomEvent<boolean>).detail);
    }
    window.addEventListener(TOGGLE_EVENT, onToggle);
    window.addEventListener(MOBILE_EVENT, onMobile);
    return () => {
      window.removeEventListener(TOGGLE_EVENT, onToggle);
      window.removeEventListener(MOBILE_EVENT, onMobile);
    };
  }, []);

  return {
    collapsed: mounted && collapsed,
    mobileOpen,
    closeMobile: () => window.dispatchEvent(new CustomEvent(MOBILE_EVENT, { detail: false })),
  };
}

function toggleCollapsed() {
  const next = !readCollapsed();
  window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  window.dispatchEvent(new CustomEvent(TOGGLE_EVENT));
}

function openMobileSidebar() {
  window.dispatchEvent(new CustomEvent(MOBILE_EVENT, { detail: true }));
}

/** Desktop/tablet: the sidebar logo itself is the collapse toggle. Mobile: the
 * sidebar is off-canvas entirely, so this stays as a topbar hamburger there instead. */
export function SidebarToggleButton() {
  return (
    <button
      onClick={() => {
        if (isMobileViewport()) {
          openMobileSidebar();
        } else {
          toggleCollapsed();
        }
      }}
      aria-label="Open menu"
      className="rounded-lg p-2 text-text-secondary hover:bg-surface hover:text-text-primary md:hidden"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

/** The clickable logo/wordmark button inside the sidebar itself — toggles collapse
 * on desktop/tablet. Not rendered in the mobile slide-over (there's nothing to
 * collapse to there; the drawer is either open or closed). */
export function SidebarLogoButton({ collapsed }: { collapsed: boolean }) {
  return (
    <button
      onClick={toggleCollapsed}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg py-2.5 hover:bg-surface",
        collapsed ? "justify-center px-0" : "mx-2 w-auto px-2",
      )}
    >
      <img
        src="/logo_only_black.png"
        alt=""
        width={collapsed ? 32 : 24}
        height={collapsed ? 32 : 24}
        className="dark:invert"
      />
      {!collapsed && <span className="text-[17px] font-semibold text-text-primary">RepairX</span>}
    </button>
  );
}
