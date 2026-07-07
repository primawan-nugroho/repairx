"use client";

import { useState, useTransition } from "react";
import { deriveUic } from "@/lib/wc-uic-map";
import type { EditableShiftEntry } from "./types";

interface EntryEditDialogProps {
  entry: EditableShiftEntry;
  canEdit: boolean;
  onSave: (id: number, formData: FormData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onClose: () => void;
}

export function EntryEditDialog({ entry, canEdit, onSave, onDelete, onClose }: EntryEditDialogProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [workCenter, setWorkCenter] = useState(entry.workCenter ?? "");

  const derivedUic = deriveUic(workCenter);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await onSave(entry.id, formData);
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
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
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
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-surface-solid shadow-[var(--shadow-popover)]">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="data-mono text-base font-semibold text-text-primary">{entry.orderNumber}</h2>
            {entry.orderDescription && (
              <p className="text-xs text-text-secondary">{entry.orderDescription}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full px-2 py-1 text-text-secondary hover:bg-surface">
            ✕
          </button>
        </div>

        <form action={handleSubmit} className="grid grid-cols-1 gap-2.5 overflow-y-auto px-5 py-4 md:grid-cols-2">
          <Field label="Work center">
            <input
              name="workCenter"
              value={workCenter}
              onChange={(e) => setWorkCenter(e.target.value)}
              disabled={!canEdit}
              className="field-input"
            />
          </Field>
          <Field label="UIC (derived)">
            <input value={derivedUic ?? "-"} readOnly disabled className="field-input text-text-secondary" />
            <input type="hidden" name="uic" value={derivedUic ?? ""} />
          </Field>

          <Field label="Ops">
            <input name="ops" defaultValue={entry.ops ?? ""} disabled={!canEdit} className="field-input data-mono" />
          </Field>
          <Field label="Status">
            <select name="completenessStatus" defaultValue={entry.completenessStatus ?? "Open"} disabled={!canEdit} className="field-input">
              <option value="Open">Open</option>
              <option value="Inprogress">Inprogress</option>
              <option value="closed">closed</option>
              <option value="Final confirm">Final confirm</option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Activity">
              <textarea name="activity" defaultValue={entry.activity ?? ""} disabled={!canEdit} rows={2} className="field-input" />
            </Field>
          </div>

          <Field label="Plan mhrs">
            <input name="planMhrs" type="number" step="0.5" defaultValue={entry.planMhrs ?? ""} disabled={!canEdit} className="field-input data-mono" />
          </Field>
          <Field label="Consumed mhrs">
            <input name="consumedMhrs" type="number" step="0.5" defaultValue={entry.consumedMhrs ?? ""} disabled={!canEdit} className="field-input data-mono" />
          </Field>
          <Field label="Manhours">
            <input name="manhours" type="number" step="0.5" defaultValue={entry.manhours ?? ""} disabled={!canEdit} className="field-input data-mono" />
          </Field>
          <Field label="Progress %">
            <input name="progressPct" type="number" min={0} max={100} defaultValue={entry.progressPct ?? ""} disabled={!canEdit} className="field-input data-mono" />
          </Field>

          <Field label="Stamp %">
            <input name="stampPct" type="number" min={0} max={100} defaultValue={entry.stampPct ?? ""} disabled={!canEdit} className="field-input data-mono" />
          </Field>
          <div>
            <Field label="Remark">
              <input name="remark" defaultValue={entry.remark ?? ""} disabled={!canEdit} className="field-input" />
            </Field>
          </div>

          {error && <p className="md:col-span-2 text-sm text-status-urgent">{error}</p>}

          <div className="md:col-span-2 flex items-center justify-between border-t border-border pt-3 -mx-5 -mb-4 px-5 pb-4">
            <div>
              {canEdit &&
                (confirmingDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-secondary">Delete this entry?</span>
                    <button type="button" onClick={handleDelete} disabled={pending} className="rounded-full bg-status-urgent px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60">
                      {pending ? "Deleting…" : "Confirm delete"}
                    </button>
                    <button type="button" onClick={() => setConfirmingDelete(false)} className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-text-primary">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmingDelete(true)} className="rounded-full border border-status-urgent px-5 py-2 text-sm font-medium text-status-urgent">
                    Delete
                  </button>
                ))}
            </div>

            {!confirmingDelete && (
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-2 text-sm font-medium text-text-primary">
                  {canEdit ? "Cancel" : "Close"}
                </button>
                {canEdit && (
                  <button type="submit" disabled={pending} className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
                    {pending ? "Saving…" : "Save"}
                  </button>
                )}
              </div>
            )}
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
