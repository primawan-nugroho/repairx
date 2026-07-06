"use client";

import Image from "next/image";
import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="vibrancy w-full max-w-[400px] rounded-lg border border-border p-8 shadow-[var(--shadow-popover)]">
        <Image
          src="/logo_only_black.png"
          alt="RepairX"
          width={40}
          height={40}
          priority
          className="mb-3 dark:invert"
        />
        <h1 className="text-[22px] font-semibold text-text-primary mb-1">RepairX</h1>
        <p className="text-sm text-text-secondary mb-8">
          Repair production control dashboard
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="w-full rounded-lg bg-surface border border-border px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg bg-surface border border-border px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-status-urgent">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
