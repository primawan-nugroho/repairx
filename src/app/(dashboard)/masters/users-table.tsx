"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/db/schema";
import { setUserActiveAction } from "./actions";
import { ResetPasswordButton } from "./reset-password-dialog";
import { EditUserButton } from "./edit-user-dialog";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  production_control: "Production control",
  viewer: "Viewer",
};

export function UsersTable({ users, currentUserId }: { users: User[]; currentUserId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleActive(user: User) {
    startTransition(async () => {
      try {
        await setUserActiveAction(user.id, !user.active);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface">
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-text-secondary">Username</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-text-secondary">Display name</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-text-secondary">Role</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-text-secondary">Status</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-text-secondary">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-border">
              <td className="px-3 py-2.5 data-mono">{user.username}</td>
              <td className="px-3 py-2.5">{user.displayName}</td>
              <td className="px-3 py-2.5 text-text-secondary">{ROLE_LABELS[user.role] ?? user.role}</td>
              <td className="px-3 py-2.5">
                <span
                  className={
                    user.active
                      ? "rounded-full bg-status-closed/15 px-2.5 py-0.5 text-xs font-medium text-status-closed"
                      : "rounded-full bg-status-open/15 px-2.5 py-0.5 text-xs font-medium text-status-open"
                  }
                >
                  {user.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <EditUserButton user={user} isSelf={user.id === currentUserId} />
                  <button
                    onClick={() => toggleActive(user)}
                    disabled={pending || user.id === currentUserId}
                    title={user.id === currentUserId ? "You cannot deactivate your own account" : undefined}
                    className="text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40"
                  >
                    {user.active ? "Deactivate" : "Activate"}
                  </button>
                  <ResetPasswordButton userId={user.id} username={user.username} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
