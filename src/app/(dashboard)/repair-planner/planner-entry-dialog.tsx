"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RepairPlannerEntry } from "@/db/schema";
import { archiveRepairPlannerEntry, createRepairPlannerEntry, updateRepairPlannerEntry } from "./actions";

interface DropdownOptions {
  engineType: string[];
  gate4Status: string[];
  projectStatus: string[];
  rpc1: string[];
  rpc2: string[];
}

interface PlannerEntryDialogProps {
  entry?: RepairPlannerEntry;
  canEdit: boolean;
  onClose: () => void;
  options: DropdownOptions;
}

const BLANK: Partial<RepairPlannerEntry> = {};

export function PlannerEntryDialog({ entry, canEdit, onClose, options }: PlannerEntryDialogProps) {
  const isNew = !entry;
  const base = entry ?? BLANK;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (isNew) {
          await createRepairPlannerEntry(formData);
        } else {
          await updateRepairPlannerEntry(entry!.id, formData);
        }
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  function handleDelete() {
    if (!entry) return;
    setError(null);
    startTransition(async () => {
      try {
        await archiveRepairPlannerEntry(entry.id);
        router.refresh();
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
          <h2 className="text-base font-semibold text-text-primary">
            {isNew ? "Add repair planner entry" : `${base.serialNumber ?? "Entry"}`}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 py-1 text-text-secondary hover:bg-surface"
          >
            ✕
          </button>
        </div>

        <form
          action={handleSubmit}
          className="grid grid-cols-1 gap-2.5 overflow-y-auto px-5 py-4 md:grid-cols-2"
        >
          <Field label="Engine/APU">
            <select
              name="engineApu"
              defaultValue={base.engineApu ?? ""}
              disabled={!canEdit}
              className="field-input"
            >
              <option value="">-</option>
              <option value="Engine">Engine</option>
              <option value="APU">APU</option>
            </select>
          </Field>
          <Field label="Customer">
            <input name="customer" defaultValue={base.customer ?? ""} disabled={!canEdit} className="field-input" />
          </Field>

          <Field label="Type">
            <input
              name="engineType"
              list="dl-engine-type"
              defaultValue={base.engineType ?? ""}
              disabled={!canEdit}
              className="field-input data-mono"
            />
            <datalist id="dl-engine-type">
              {options.engineType.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </Field>
          <Field label="Serial number">
            <input
              name="serialNumber"
              defaultValue={base.serialNumber ?? ""}
              disabled={!canEdit}
              className="field-input data-mono"
            />
          </Field>

          <Field label="EO">
            <input name="eo" defaultValue={base.eo ?? ""} disabled={!canEdit} className="field-input" />
          </Field>
          <Field label="Induction date">
            <input
              type="date"
              name="inductionDate"
              defaultValue={base.inductionDate ?? ""}
              disabled={!canEdit}
              className="field-input data-mono"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Workscope">
              <input
                name="workscope"
                defaultValue={base.workscope ?? ""}
                disabled={!canEdit}
                className="field-input"
              />
            </Field>
          </div>

          <Field label="RPC-1">
            <input
              name="rpc1"
              list="dl-rpc1"
              defaultValue={base.rpc1 ?? ""}
              disabled={!canEdit}
              className="field-input"
            />
            <datalist id="dl-rpc1">
              {options.rpc1.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </Field>
          <Field label="RPC-2">
            <input
              name="rpc2"
              list="dl-rpc2"
              defaultValue={base.rpc2 ?? ""}
              disabled={!canEdit}
              className="field-input"
            />
            <datalist id="dl-rpc2">
              {options.rpc2.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </Field>

          <Field label="Gate 4 status">
            <input
              name="gate4Status"
              list="dl-gate4"
              defaultValue={base.gate4Status ?? ""}
              disabled={!canEdit}
              className="field-input"
            />
            <datalist id="dl-gate4">
              {options.gate4Status.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </Field>
          <Field label="Project status">
            <input
              name="projectStatus"
              list="dl-project-status"
              defaultValue={base.projectStatus ?? ""}
              disabled={!canEdit}
              className="field-input"
            />
            <datalist id="dl-project-status">
              {options.projectStatus.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </Field>

          <div className="md:col-span-2">
            <Field label="Remark">
              <textarea
                name="remark"
                defaultValue={base.remark ?? ""}
                disabled={!canEdit}
                rows={2}
                className="field-input"
              />
            </Field>
          </div>

          {error && <p className="md:col-span-2 text-sm text-status-urgent">{error}</p>}

          <div className="md:col-span-2 flex items-center justify-between border-t border-border pt-3 -mx-5 -mb-4 px-5 pb-4">
            <div>
              {canEdit && !isNew && (
                confirmingDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-secondary">Delete this entry?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={pending}
                      className="rounded-full bg-status-urgent px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {pending ? "Deleting…" : "Confirm delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="rounded-full border border-status-urgent px-5 py-2 text-sm font-medium text-status-urgent"
                  >
                    Delete
                  </button>
                )
              )}
            </div>

            {!confirmingDelete && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-border px-5 py-2 text-sm font-medium text-text-primary"
                >
                  {canEdit ? "Cancel" : "Close"}
                </button>
                {canEdit && (
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {pending ? "Saving…" : isNew ? "Create entry" : "Save"}
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
