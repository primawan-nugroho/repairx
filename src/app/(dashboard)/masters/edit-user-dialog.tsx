"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/db/schema";
import { updateUserAction } from "./actions";

export function EditUserButton({ user, isSelf }: { user: User; isSelf: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("userId", String(user.id));
    startTransition(async () => {
      try {
        await updateUserAction(formData);
        router.refresh();
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
        className="text-xs font-medium text-accent hover:underline"
      >
        Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-surface-solid shadow-[var(--shadow-popover)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="data-mono text-base font-semibold text-text-primary">Edit user — {user.username}</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full px-2 py-1 text-text-secondary hover:bg-surface"
              >
                ✕
              </button>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-3 px-5 py-4">
              <Field label="Username">
                <input
                  name="username"
                  defaultValue={user.username}
                  required
                  className="field-input data-mono"
                  autoComplete="off"
                />
              </Field>
              <Field label="Display name">
                <input name="displayName" defaultValue={user.displayName} required className="field-input" />
              </Field>
              <Field label="Role">
                <select name="role" defaultValue={user.role} disabled={isSelf} className="field-input">
                  <option value="admin">Admin</option>
                  <option value="production_control">Production control</option>
                  <option value="viewer">Viewer</option>
                </select>
                {isSelf && (
                  <span className="text-xs text-text-tertiary">You cannot change your own role.</span>
                )}
              </Field>

              {error && <p className="text-sm text-status-urgent">{error}</p>}

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-border px-5 py-2 text-sm font-medium text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>

            <style jsx>{`
              .field-input {
                width: 100%;
                border-radius: 8px;
                background: var(--surface);
                border: 1px solid var(--border);
                padding: 7px 12px;
                font-size: 14px;
                color: var(--text-primary);
              }
              .field-input:focus {
                outline: none;
                border-color: var(--accent);
                box-shadow: 0 0 0 4px var(--accent-bg);
              }
              .field-input:disabled {
                opacity: 0.7;
              }
            `}</style>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      {children}
    </div>
  );
}
