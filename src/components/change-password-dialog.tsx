"use client";

import { useState, useTransition } from "react";
import { changeOwnPasswordAction } from "@/lib/account-actions";

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await changeOwnPasswordAction(formData);
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface-solid shadow-[var(--shadow-popover)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">Change password</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 py-1 text-text-secondary hover:bg-surface"
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="px-5 py-4">
            <p className="text-sm text-status-closed">Password updated.</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col gap-3 px-5 py-4">
            <Field label="Current password">
              <input
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className="field-input"
              />
            </Field>
            <Field label="New password">
              <input
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="field-input"
              />
            </Field>
            <Field label="Confirm new password">
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="field-input"
              />
            </Field>

            {error && <p className="text-sm text-status-urgent">{error}</p>}

            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border px-5 py-2 text-sm font-medium text-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {pending ? "Saving…" : "Change password"}
              </button>
            </div>

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
            `}</style>
          </form>
        )}
      </div>
    </div>
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
