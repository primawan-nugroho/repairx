"use client";

import { useEffect, useState } from "react";

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

export function SidebarToggleButton() {
  return (
    <button
      onClick={() => {
        if (isMobileViewport()) {
          window.dispatchEvent(new CustomEvent(MOBILE_EVENT, { detail: true }));
        } else {
          const next = !readCollapsed();
          window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
          window.dispatchEvent(new CustomEvent(TOGGLE_EVENT));
        }
      }}
      aria-label="Toggle sidebar"
      className="rounded-lg p-2 text-text-secondary hover:bg-surface hover:text-text-primary"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
