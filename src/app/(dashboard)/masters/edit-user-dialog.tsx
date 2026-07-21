"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from "@/db/schema";
import { updateUserAction } from "./actions";

export function EditUserButton({ user, isSelf }: { user: User; isSelf: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>(user.role);

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("userId", String(user.id));
    formData.set("role", role);
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
      <Button
        variant="link"
        className="h-auto p-0 text-xs"
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
      >
        Edit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="data-mono">Edit user — {user.username}</DialogTitle>
          </DialogHeader>

          <form action={handleSubmit} className="flex flex-col gap-3 px-5 py-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                defaultValue={user.username}
                required
                className="data-mono"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" name="displayName" defaultValue={user.displayName} required />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole} disabled={isSelf}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="production_control">Production control</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              {isSelf && <span className="text-xs text-text-tertiary">You cannot change your own role.</span>}
            </div>

            {error && <p className="text-sm text-status-urgent">{error}</p>}

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
