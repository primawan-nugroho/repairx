"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/db/schema";
import { deriveUic } from "@/lib/wc-uic-map";
import { upsertOrder } from "./actions";

export function OrderEditDialog({
  order,
  canEdit,
  onClose,
}: {
  order: Order;
  canEdit: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mwcToday, setMwcToday] = useState(order.mwcToday ?? "");
  const [waitingRepair, setWaitingRepair] = useState(order.waitingRepair);

  const derivedUic = deriveUic(mwcToday);

  function handleSubmit(formData: FormData) {
    formData.set("mwcToday", mwcToday);
    formData.set(
      "planFinishDate",
      waitingRepair ? "WR" : (formData.get("planFinishDate") as string) || "",
    );
    startTransition(async () => {
      await upsertOrder(formData);
      router.refresh();
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="vibrancy w-full max-w-2xl rounded-lg border border-border p-6 shadow-[var(--shadow-popover)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="data-mono text-lg font-semibold text-text-primary">
            Order {order.orderNumber}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 py-1 text-text-secondary hover:bg-surface"
          >
            ✕
          </button>
        </div>

        <form action={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input type="hidden" name="orderNumber" value={order.orderNumber} />

          <Field label="Date in">
            <input
              type="date"
              name="dateIn"
              defaultValue={order.dateIn ?? ""}
              disabled={!canEdit}
              className="field-input data-mono"
            />
          </Field>
          <Field label="Gate 4 target">
            <input
              type="date"
              name="gate4Target"
              defaultValue={order.gate4Target ?? ""}
              disabled={!canEdit}
              className="field-input data-mono"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Description">
              <input
                name="description"
                defaultValue={order.description ?? ""}
                disabled={!canEdit}
                className="field-input"
              />
            </Field>
          </div>

          <Field label="Serial number">
            <input
              name="serialNumber"
              defaultValue={order.serialNumber ?? ""}
              disabled={!canEdit}
              className="field-input data-mono"
            />
          </Field>
          <Field label="Engine type">
            <input
              name="engineType"
              defaultValue={order.engineType ?? ""}
              disabled={!canEdit}
              className="field-input"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="MWC routing">
              <input
                name="mwcRouting"
                defaultValue={order.mwcRouting ?? ""}
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
              defaultValue={order.tier ?? ""}
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
              defaultValue={order.status ?? ""}
              disabled={!canEdit}
              className="field-input"
            />
          </Field>

          <Field label="Plan finish date">
            <input
              type="date"
              name="planFinishDate"
              defaultValue={order.waitingRepair ? "" : order.planFinishDate ?? ""}
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
              defaultValue={order.location ?? ""}
              disabled={!canEdit}
              className="field-input"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Remark">
              <textarea
                name="remark"
                defaultValue={order.remark ?? ""}
                disabled={!canEdit}
                rows={2}
                className="field-input"
              />
            </Field>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
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
                {pending ? "Saving…" : "Save"}
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
            padding: 8px 12px;
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
