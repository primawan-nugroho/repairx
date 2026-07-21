"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RepairPlannerEntry } from "@/db/schema";
import { isEngineType } from "@/lib/engine-types";
import { PLANNER_STATUSES } from "@/lib/planner-status";
import { useDialogShortcuts } from "@/lib/use-dialog-shortcuts";
import { useToast } from "@/components/toast";
import { archiveRepairPlannerEntry, createRepairPlannerEntry, updateRepairPlannerEntry } from "./actions";

interface PlannerEntryDialogProps {
  entry?: RepairPlannerEntry;
  canEdit: boolean;
  onClose: () => void;
  /** Canonical engine/APU type list (see lib/masters.ts) — distinct from any
   * column-filter option list, which is just the values already present in this
   * table's own rows. */
  engineTypes: string[];
  rpcNames: string[];
  eoNames: string[];
}

const BLANK: Partial<RepairPlannerEntry> = {};

/** Renders a select for a canonical-list field, preserving an existing value that
 * isn't (or is no longer) in the list as a disabled "current" option — so saving the
 * form without touching this field never silently wipes a legacy value that predates
 * the canonical list (e.g. a name removed from Masters, or an old free-text status). */
function CanonicalSelect({
  name,
  value,
  options,
  disabled,
  onChange,
}: {
  name: string;
  value: string;
  options: string[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const hasLegacyValue = value && !options.includes(value);
  return (
    <select name={name} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="field-input">
      <option value="">— unset —</option>
      {hasLegacyValue && (
        <option value={value} disabled>
          {value} (not in list)
        </option>
      )}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function PlannerEntryDialog({ entry, canEdit, onClose, engineTypes, rpcNames, eoNames }: PlannerEntryDialogProps) {
  const isNew = !entry;
  const base = entry ?? BLANK;
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [engineType, setEngineType] = useState(isEngineType(base.engineType, engineTypes) ? base.engineType : "");
  const [eo, setEo] = useState(base.eo ?? "");
  const [rpc1, setRpc1] = useState(base.rpc1 ?? "");
  const [rpc2, setRpc2] = useState(base.rpc2 ?? "");
  const [gate4Status, setGate4Status] = useState(base.gate4Status ?? "");
  const [projectStatus, setProjectStatus] = useState(base.projectStatus ?? "");

  useDialogShortcuts(formRef, onClose, canEdit && !confirmingDelete);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (isNew) {
          await createRepairPlannerEntry(formData);
          showToast("Entry created");
        } else {
          await updateRepairPlannerEntry(entry!.id, formData);
          showToast("Entry saved");
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
        showToast("Entry deleted");
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
          ref={formRef}
          action={handleSubmit}
          className="grid grid-cols-1 gap-2.5 overflow-y-auto px-5 py-4 md:grid-cols-2"
        >
          <Field label="Engine/APU">
            <select
              name="engineApu"
              defaultValue={base.engineApu ?? ""}
              disabled={!canEdit}
              autoFocus
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
            <select
              name="engineType"
              value={engineType}
              onChange={(e) => setEngineType(e.target.value)}
              disabled={!canEdit}
              className="field-input data-mono"
            >
              <option value="">— unset —</option>
              {engineTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
            <CanonicalSelect name="eo" value={eo} options={eoNames} disabled={!canEdit} onChange={setEo} />
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
            <CanonicalSelect name="rpc1" value={rpc1} options={rpcNames} disabled={!canEdit} onChange={setRpc1} />
          </Field>
          <Field label="RPC-2">
            <CanonicalSelect name="rpc2" value={rpc2} options={rpcNames} disabled={!canEdit} onChange={setRpc2} />
          </Field>

          <Field label="Gate 4 status">
            <CanonicalSelect
              name="gate4Status"
              value={gate4Status}
              options={[...PLANNER_STATUSES]}
              disabled={!canEdit}
              onChange={setGate4Status}
            />
          </Field>
          <Field label="Project status">
            <CanonicalSelect
              name="projectStatus"
              value={projectStatus}
              options={[...PLANNER_STATUSES]}
              disabled={!canEdit}
              onChange={setProjectStatus}
            />
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
