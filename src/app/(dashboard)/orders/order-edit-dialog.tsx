"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Order } from "@/db/schema";
import type { OrderMasters } from "@/lib/masters";
import { deriveStatus, deriveUic } from "@/lib/wc-uic-map";
import { ORDER_STATUSES, isCanonicalOrderStatus } from "@/lib/order-status";
import { isEngineType } from "@/lib/engine-types";
import { useDialogShortcuts } from "@/lib/use-dialog-shortcuts";
import { useToast } from "@/components/toast";
import { archiveOrder, createOrder, lookupEngineTypeBySerial, upsertOrder } from "./actions";

interface OrderEditDialogProps {
  order?: Order;
  canEdit: boolean;
  masters: OrderMasters;
  onClose: () => void;
}

const BLANK_ORDER: Partial<Order> = {};

export function OrderEditDialog({ order, canEdit, masters, onClose }: OrderEditDialogProps) {
  const isNew = !order;
  const base = order ?? BLANK_ORDER;
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState(base.orderNumber ?? "");
  const [mwcToday, setMwcToday] = useState(base.mwcToday ?? "");
  const [serialNumber, setSerialNumber] = useState(base.serialNumber ?? "");
  const [engineType, setEngineType] = useState(isEngineType(base.engineType, masters.engineTypes) ? base.engineType : "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const derivedUic = deriveUic(mwcToday, masters.workCenterToUic);

  useDialogShortcuts(formRef, onClose, canEdit && !confirmingDelete);

  async function handleSerialBlur(value: string) {
    if (!value.trim() || engineType) return;
    const found = await lookupEngineTypeBySerial(value);
    if (found && isEngineType(found, masters.engineTypes)) {
      setEngineType(found);
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("orderNumber", orderNumber.trim());
    formData.set("mwcToday", mwcToday);
    startTransition(async () => {
      try {
        if (isNew) {
          await createOrder(formData);
          showToast("Order created");
        } else {
          await upsertOrder(formData);
          showToast("Order saved");
        }
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  function handleDelete() {
    if (!order) return;
    setError(null);
    startTransition(async () => {
      try {
        await archiveOrder(order.orderNumber);
        showToast("Order deleted");
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
          <div className="flex items-center gap-3">
            {!isNew && (
              <Link
                href={`/orders/${encodeURIComponent(order!.orderNumber)}`}
                className="text-xs font-medium text-accent hover:underline"
              >
                View history
              </Link>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full px-2 py-1 text-text-secondary hover:bg-surface"
            >
              ✕
            </button>
          </div>
        </div>

        <form
          ref={formRef}
          action={handleSubmit}
          className="grid grid-cols-1 gap-2.5 overflow-y-auto px-5 py-4 md:grid-cols-2"
        >
          {!isNew && <input type="hidden" name="originalOrderNumber" value={order!.orderNumber} />}
          <input type="hidden" name="engineType" value={engineType} />

          <div className="md:col-span-2">
            <Field label="Order number">
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
                disabled={!canEdit}
                autoFocus
                className="field-input data-mono"
              />
            </Field>
          </div>

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
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              onBlur={(e) => handleSerialBlur(e.target.value)}
              disabled={!canEdit}
              className="field-input data-mono"
            />
          </Field>
          <Field label="Engine type">
            <select
              value={engineType}
              onChange={(e) => setEngineType(e.target.value)}
              disabled={!canEdit}
              className="field-input"
            >
              <option value="">— unset —</option>
              {masters.engineTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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

          <Field label="Status">
            {masters.terminalUic && derivedUic === masters.terminalUic ? (
              <>
                <input
                  value={`${deriveStatus(derivedUic, null, masters.terminalUic)} (auto — in serviceable store)`}
                  readOnly
                  disabled
                  className="field-input text-text-secondary"
                />
                <input type="hidden" name="status" value={deriveStatus(derivedUic, null, masters.terminalUic) ?? ""} />
              </>
            ) : (
              <select
                name="status"
                defaultValue={isCanonicalOrderStatus(base.status) ? base.status : ""}
                disabled={!canEdit}
                className="field-input"
              >
                <option value="">— unset —</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Plan finish date">
            <input
              type="date"
              name="planFinishDate"
              defaultValue={base.planFinishDate ?? ""}
              disabled={!canEdit}
              className="field-input data-mono"
            />
          </Field>

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

          <div className="md:col-span-2 flex items-center justify-between border-t border-border pt-3 -mx-5 -mb-4 px-5 pb-4">
            <div>
              {canEdit && !isNew && (
                confirmingDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-secondary">Delete this order?</span>
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
                    {pending ? "Saving…" : isNew ? "Create order" : "Save"}
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
