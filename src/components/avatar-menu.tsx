"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/account-actions";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  production_control: "Production control",
  viewer: "Viewer",
};

export function AvatarMenu({
  avatarSvg,
  name,
  role,
  username,
  variant = "header",
  collapsed = false,
}: {
  avatarSvg: string;
  name: string;
  role: string;
  /** Only used by variant="sidebar" — the second line reads "{username} as {role}",
   * matching the CMMS sidebar footer's "9722292 as Super" convention. */
  username?: string;
  /** "header": the original 32px round trigger for the topbar. "sidebar": a
   * full-width footer row (avatar + name/role stack), opening upward since it
   * sits at the bottom of the rail. */
  variant?: "header" | "sidebar";
  /** Sidebar-only — collapses the row to just the avatar when the rail is collapsed. */
  collapsed?: boolean;
}) {
  const [changingPassword, setChangingPassword] = useState(false);

  const avatarButton = (
    <span
      aria-hidden
      className="avatar-button block h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border"
      dangerouslySetInnerHTML={{ __html: avatarSvg }}
    />
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === "sidebar" ? (
            <button
              aria-label="Account menu"
              className={cn(
                "flex w-full items-center gap-2 rounded-lg py-1.5 text-left hover:bg-surface",
                collapsed ? "justify-center px-0" : "px-2",
              )}
            >
              {avatarButton}
              {!collapsed && (
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-sm font-medium text-text-primary">{name}</span>
                  <span className="data-mono truncate text-xs text-text-tertiary">
                    {username ? `${username} as ` : ""}
                    {ROLE_LABELS[role] ?? role}
                  </span>
                </span>
              )}
            </button>
          ) : (
            <button aria-label="Account menu" className="rounded-full">
              {avatarButton}
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={variant === "sidebar" ? "start" : "end"}
          side={variant === "sidebar" ? "top" : "bottom"}
          className="w-56 p-0"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-text-primary">{name}</p>
            <p className="data-mono text-xs text-text-tertiary">{ROLE_LABELS[role] ?? role}</p>
          </div>
          <div className="p-1.5">
            <DropdownMenuItem onSelect={() => setChangingPassword(true)}>Change password</DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <form action={signOutAction}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-left">
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <style jsx global>{`
        .avatar-button svg {
          width: 100%;
          height: 100%;
          display: block;
        }
      `}</style>

      {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} />}
    </>
  );
}
