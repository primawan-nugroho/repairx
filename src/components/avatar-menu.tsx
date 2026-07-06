"use client";

import { useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        className="avatar-button h-8 w-8 overflow-hidden rounded-full border border-border"
        dangerouslySetInnerHTML={{ __html: avatarSvg }}
      />
      <style jsx>{`
        .avatar-button :global(svg) {
          width: 100%;
          height: 100%;
          display: block;
        }
      `}</style>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="vibrancy absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border shadow-[var(--shadow-popover)]">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-text-primary">{name}</p>
              <p className="data-mono text-xs text-text-tertiary">
                {ROLE_LABELS[role] ?? role}
              </p>
            </div>
            <div className="flex flex-col p-1.5">
              <button
                onClick={() => {
                  setOpen(false);
                  setChangingPassword(true);
                }}
                className="rounded-md px-2.5 py-2 text-left text-sm text-text-primary hover:bg-surface"
              >
                Change password
              </button>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="w-full rounded-md px-2.5 py-2 text-left text-sm text-text-primary hover:bg-surface"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} />}
    </div>
  );
}
