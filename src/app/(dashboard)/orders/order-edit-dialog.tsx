"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/db/schema";
import { deriveUic } from "@/lib/wc-uic-map";
import { createOrder, upsertOrder } from "./actions";

interface OrderEditDialogProps {
  order?: Order;
  canEdit: boolean;
  onClose: () => void;
}

const BLANK_ORDER: Partial<Order> = {};

export function OrderEditDialog({ order, canEdit, onClose }: OrderEditDialogProps) {
  const isNew = !order;
  const base = order ?? BLANK_ORDER;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState(base.orderNumber ?? "");
  const [mwcToday, setMwcToday] = useState(base.mwcToday ?? "");
  const [waitingRepair, setWaitingRepair] = useState(base.waitingRepair ?? false);

  const derivedUic = deriveUic(mwcToday);

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("orderNumber", orderNumber.trim());
    formData.set("mwcToday", mwcToday);
    formData.set(
      "planFinishDate",
      waitingRepair ? "WR" : (formData.get("planFinishDate") as string) || "",
    );
    startTransition(async () => {
      try {
        if (isNew) {
          await createOrder(formData);
        } else {
          await upsertOrder(formData);
        }
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
          <h2 className="data-mono text-base font-semibold text-text-primary">
            {isNew ? "Add order" : `Order ${order!.orderNumber}`}
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
          {isNew ? (
            <div className="md:col-span-2">
              <Field label="Order number">
                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  required
                  disabled={!canEdit}
                  className="field-input data-mono"
                />
              </Field>
            </div>
          ) : (
            <input type="hidden" name="orderNumber" value={order!.orderNumber} />
          )}

          <Field label="Date in">
            <input
              type="date"
              name="dateIn"
              defaultValue={base.dateIn ?? ""}
              disabled={!canEdit}
              className="field-input data-mono"
            />
          </Field>
          <Field label="Gate 4 target">
            <input
              type="date"
              name="gate4Target"
              defaultValue={base.gate4Target ?? ""}
              disabled={!canEdit}
              className="field-input data-mono"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Description">
              <input
                name="description"
                defaultValue={base.description ?? ""}
                disabled={!canEdit}
                className="field-input"
              />
            </Field>
          </div>

          <Field label="Serial number">
            <input
              name="serialNumber"
              defaultValue={base.serialNumber ?? ""}
              disabled={!canEdit}
              className="field-input data-mono"
            />
          </Field>
          <Field label="Engine type">
            <input
              name="engineType"
              defaultValue={base.engineType ?? ""}
              disabled={!canEdit}
              className="field-input"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="MWC routing">
              <input
                name="mwcRouting"
                defaultValue={base.mwcRouting ?? ""}
                disabled={!canEdit}
                className="field-input data-mono"
              />
            </Field>
          </div>

          <Field label="Work center (today)">
            <input
              value={mwcToday}
              onChange={(e) => setMwcToday(e.target.value)}
              disabled={!canEdit}
              className="field-input"
            />
          </Field>
          <Field label="UIC (derived)">
            <input value={derivedUic ?? "-"} readOnly disabled className="field-input text-text-secondary" />
          </Field>

          <Field label="Tier">
            <select
              name="tier"
              defaultValue={base.tier ?? ""}
              disabled={!canEdit}
              className="field-input"
            >
              <option value="">-</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
          </Field>
          <Field label="Status">
            <input
              name="status"
              defaultValue={base.status ?? ""}
              disabled={!canEdit}
              className="field-input"
            />
          </Field>

          <Field label="Plan finish date">
            <input
              type="date"
              name="planFinishDate"
              defaultValue={base.waitingRepair ? "" : base.planFinishDate ?? ""}
              disabled={!canEdit || waitingRepair}
              className="field-input data-mono"
            />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={waitingRepair}
              onChange={(e) => setWaitingRepair(e.target.checked)}
              disabled={!canEdit}
            />
            Waiting for repair (WR, no date yet)
          </label>

          <Field label="Location">
            <input
              name="location"
              defaultValue={base.location ?? ""}
              disabled={!canEdit}
              className="field-input"
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

          <div className="md:col-span-2 flex justify-end gap-3 border-t border-border pt-3 -mx-5 -mb-4 px-5 pb-4">
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
                {pending ? "Saving…" : isNew ? "Create order" : "Save"}
              </button>
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
