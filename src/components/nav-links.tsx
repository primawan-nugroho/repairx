"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/orders",
    label: "Orders",
    icon: (
      <>
        <rect x="5" y="3.5" width="14" height="17" rx="2" strokeWidth={1.8} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3v2.4M15 3v2.4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 11h8M8 14.5h8M8 18h5" />
      </>
    ),
  },
  {
    href: "/shift-report",
    label: "Shift report",
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M6 6h12v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6M9 16h4" />
      </>
    ),
  },
  {
    href: "/daily-menu",
    label: "Daily menu",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" strokeWidth={1.8} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 7.5v5l3 2" />
      </>
    ),
  },
  {
    href: "/repair-planner",
    label: "Repair planner",
    icon: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" strokeWidth={1.8} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 3v4M16 3v4M4 10h16" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m9 15 2 2 4-4" />
      </>
    ),
  },
  {
    href: "/masters",
    label: "Masters",
    icon: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="2.5" strokeWidth={1.8} />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6"
        />
      </>
    ),
  },
];

export function NavLinks({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
              collapsed && "justify-center px-0",
              active
                ? "bg-accent-bg font-medium text-accent"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="h-[18px] w-[18px] shrink-0"
            >
              {item.icon}
            </svg>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
