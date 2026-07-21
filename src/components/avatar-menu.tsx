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

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  production_control: "Production control",
  viewer: "Viewer",
};

export function AvatarMenu({
  avatarSvg,
  name,
  role,
}: {
  avatarSvg: string;
  name: string;
  role: string;
}) {
  const [changingPassword, setChangingPassword] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Account menu"
            className="avatar-button h-8 w-8 overflow-hidden rounded-full border border-border"
            dangerouslySetInnerHTML={{ __html: avatarSvg }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-0">
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
