"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <Button
        variant="link"
        className="h-auto p-0 text-xs"
        onClick={() => {
          setOpen(true);
          setDone(false);
          setError(null);
        }}
      >
        Reset password
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Reset password — <span className="data-mono">{username}</span>
            </DialogTitle>
          </DialogHeader>

          {done ? (
            <div className="px-5 py-4">
              <p className="text-sm text-status-closed">Password updated.</p>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setOpen(false)}>Done</Button>
              </div>
            </div>
          ) : (
            <form action={handleSubmit} className="flex flex-col gap-3 px-5 py-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
              </div>
              {error && <p className="text-sm text-status-urgent">{error}</p>}
              <div className="mt-2 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Reset password"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
