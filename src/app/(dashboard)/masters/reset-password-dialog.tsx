"use client";

import { useState, useTransition } from "react";
import { resetPasswordAction } from "./actions";

export function ResetPasswordButton({ userId, username }: { userId: number; username: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("userId", String(userId));
    startTransition(async () => {
      try {
        await resetPasswordAction(formData);
        setDone(true);
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
          setDone(false);
          setError(null);
        }}
        className="text-xs font-medium text-accent hover:underline"
      >
        Reset password
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface-solid shadow-[var(--shadow-popover)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-base font-semibold text-text-primary">
                Reset password — <span className="data-mono">{username}</span>
              </h2>
              <button
                onClick={() => setOpen(false)}
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
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form action={handleSubmit} className="flex flex-col gap-3 px-5 py-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-text-secondary">New password</span>
                  <input
                    name="newPassword"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg"
                  />
                </div>
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
                    {pending ? "Saving…" : "Reset password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
