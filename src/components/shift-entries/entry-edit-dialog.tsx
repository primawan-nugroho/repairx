"use client";

import { useRef, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
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
import { deriveUic } from "@/lib/wc-uic-map";
import { BARCODE_STATUSES, isBarcodeStatus } from "@/lib/shift-status";
import { useDialogShortcuts } from "@/lib/use-dialog-shortcuts";
import { useToast } from "@/components/toast";
import type { EditableShiftEntry } from "./types";

interface EntryEditDialogProps {
  entry: EditableShiftEntry;
  canEdit: boolean;
  showManhours: boolean;
  /** Progress %/Stamp/Barcode status are end-of-shift completion fields — irrelevant
   * for the Daily Menu, which is a forward-looking plan, not a completion record.
   * Defaults true (Shift Report keeps all three). */
  showCompletion?: boolean;
  onSave: (id: number, formData: FormData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onClose: () => void;
  workCenterToUic: Record<string, string>;
}

export function EntryEditDialog({
  entry,
  canEdit,
  showManhours,
  showCompletion = true,
  onSave,
  onDelete,
  onClose,
  workCenterToUic,
}: EntryEditDialogProps) {
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [workCenter, setWorkCenter] = useState(entry.workCenter ?? "");
  const [completenessStatus, setCompletenessStatus] = useState(
    isBarcodeStatus(entry.completenessStatus) ? entry.completenessStatus : "",
  );

  const derivedUic = deriveUic(workCenter, workCenterToUic);

  // Escape is gated by !confirmingDelete (see below), which Radix's built-in Escape
  // handling doesn't know about — suppressed on DialogContent so this hook stays the
  // single source of truth, same as every other dialog in this app.
  useDialogShortcuts(formRef, onClose, canEdit && !confirmingDelete);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await onSave(entry.id, formData);
        showToast("Entry saved");
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await onDelete(entry.id);
        showToast("Entry deleted");
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl gap-0 p-0"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div>
            <DialogTitle className="data-mono">{entry.orderNumber}</DialogTitle>
            {entry.orderDescription && <p className="text-xs text-text-secondary">{entry.orderDescription}</p>}
            {(entry.orderSerialNumber || entry.orderEngineType) && (
              <p className="data-mono mt-0.5 text-xs text-text-secondary">
                {entry.orderSerialNumber ?? "-"} · {entry.orderEngineType ?? "-"}
              </p>
            )}
          </div>
        </DialogHeader>

        <form
          ref={formRef}
          action={handleSubmit}
          className="grid grid-cols-1 gap-2.5 overflow-y-auto px-5 py-4 md:grid-cols-2"
        >
          {showCompletion ? (
            <input type="hidden" name="completenessStatus" value={completenessStatus} />
          ) : (
            // Fields are hidden, but the entry may already carry values from before
            // (e.g. copied in via "populate from previous shift") — pass them through
            // unchanged instead of letting the schema's checkbox default(false)/absent
            // fields silently clear them when other fields are edited and saved.
            entry.completenessStatus && <input type="hidden" name="completenessStatus" value={entry.completenessStatus} />
          )}
          {!showCompletion && entry.progressPct != null && (
            <input type="hidden" name="progressPct" value={entry.progressPct} />
          )}
          {!showCompletion && entry.stamp && <input type="hidden" name="stamp" value="on" />}

          <div className="flex flex-col gap-1">
            <Label htmlFor="workCenter">Work center</Label>
            <Input
              id="workCenter"
              name="workCenter"
              value={workCenter}
              onChange={(e) => setWorkCenter(e.target.value)}
              disabled={!canEdit}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>UIC (derived)</Label>
            <Input value={derivedUic ?? "-"} readOnly disabled className="text-text-secondary" />
            <input type="hidden" name="uic" value={derivedUic ?? ""} />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="ops">Ops</Label>
            <Input id="ops" name="ops" defaultValue={entry.ops ?? ""} disabled={!canEdit} className="data-mono" />
          </div>
          {showCompletion && (
            <div className="flex flex-col gap-1">
              <Label>Barcode status</Label>
              <Select value={completenessStatus} onValueChange={setCompletenessStatus} disabled={!canEdit}>
                <SelectTrigger>
                  <SelectValue placeholder="— unset —" />
                </SelectTrigger>
                <SelectContent>
                  {BARCODE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label htmlFor="activity">Activity</Label>
            <textarea
              id="activity"
              name="activity"
              defaultValue={entry.activity ?? ""}
              disabled={!canEdit}
              rows={2}
              className="flex w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {showManhours && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="planMhrs">Manhours</Label>
              <Input
                id="planMhrs"
                name="planMhrs"
                type="number"
                step="0.5"
                defaultValue={entry.planMhrs ?? ""}
                disabled={!canEdit}
                className="data-mono"
              />
            </div>
          )}
          {showCompletion && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="progressPct">Progress %</Label>
              <Input
                id="progressPct"
                name="progressPct"
                type="number"
                min={0}
                max={100}
                defaultValue={entry.progressPct ?? ""}
                disabled={!canEdit}
                className="data-mono"
              />
            </div>
          )}

          {showCompletion && (
          <div className="flex flex-col gap-1">
            <Label>Stamp</Label>
            <label className="flex h-9 items-center gap-2 rounded-sm border border-border bg-surface px-3 text-sm">
              <input
                name="stamp"
                type="checkbox"
                defaultChecked={entry.stamp}
                disabled={!canEdit}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span className="text-text-secondary">Stamped</span>
            </label>
          </div>
          )}
          <div className="flex flex-col gap-1">
            <Label htmlFor="remark">Remark</Label>
            <Input id="remark" name="remark" defaultValue={entry.remark ?? ""} disabled={!canEdit} />
          </div>

          {error && <p className="text-sm text-status-urgent md:col-span-2">{error}</p>}
        </form>

        <DialogFooter>
          <div>
            {canEdit &&
              (confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Delete this entry?</span>
                  <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
                    {pending ? "Deleting…" : "Confirm delete"}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmingDelete(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className="border-status-urgent text-status-urgent"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </Button>
              ))}
          </div>

          {!confirmingDelete && (
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={onClose}>
                {canEdit ? "Cancel" : "Close"}
              </Button>
              {canEdit && (
                <Button type="submit" form="" disabled={pending} onClick={() => formRef.current?.requestSubmit()}>
                  {pending ? "Saving…" : "Save"}
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
