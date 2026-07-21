"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [status, setStatus] = useState(isCanonicalOrderStatus(base.status) ? base.status : "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const derivedUic = deriveUic(mwcToday, masters.workCenterToUic);
  const autoStatus =
    masters.terminalUic && derivedUic === masters.terminalUic
      ? deriveStatus(derivedUic, null, masters.terminalUic)
      : null;

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl gap-0 p-0"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="data-mono">{isNew ? "Add order" : `Order ${order!.orderNumber}`}</DialogTitle>
          {!isNew && (
            <Link
              href={`/orders/${encodeURIComponent(order!.orderNumber)}`}
              className="mr-8 text-xs font-medium text-accent hover:underline"
            >
              View history
            </Link>
          )}
        </DialogHeader>

        <form
          ref={formRef}
          action={handleSubmit}
          className="grid grid-cols-1 gap-2.5 overflow-y-auto px-5 py-4 md:grid-cols-2"
        >
          {!isNew && <input type="hidden" name="originalOrderNumber" value={order!.orderNumber} />}
          <input type="hidden" name="engineType" value={engineType} />
          {autoStatus && <input type="hidden" name="status" value={autoStatus} />}

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label>Order number</Label>
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              disabled={!canEdit}
              autoFocus
              className="data-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="dateIn">Date in</Label>
            <Input id="dateIn" type="date" name="dateIn" defaultValue={base.dateIn ?? ""} disabled={!canEdit} className="data-mono" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="gate4Target">Gate 4 target</Label>
            <Input
              id="gate4Target"
              type="date"
              name="gate4Target"
              defaultValue={base.gate4Target ?? ""}
              disabled={!canEdit}
              className="data-mono"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" defaultValue={base.description ?? ""} disabled={!canEdit} />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="serialNumber">Serial number</Label>
            <Input
              id="serialNumber"
              name="serialNumber"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              onBlur={(e) => handleSerialBlur(e.target.value)}
              disabled={!canEdit}
              className="data-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Engine type</Label>
            <Select value={engineType} onValueChange={setEngineType} disabled={!canEdit}>
              <SelectTrigger>
                <SelectValue placeholder="— unset —" />
              </SelectTrigger>
              <SelectContent>
                {masters.engineTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label htmlFor="mwcRouting">MWC routing</Label>
            <Input id="mwcRouting" name="mwcRouting" defaultValue={base.mwcRouting ?? ""} disabled={!canEdit} className="data-mono" />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="mwcToday">Work center (today)</Label>
            <Input id="mwcToday" value={mwcToday} onChange={(e) => setMwcToday(e.target.value)} disabled={!canEdit} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>UIC (derived)</Label>
            <Input value={derivedUic ?? "-"} readOnly disabled className="text-text-secondary" />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Status</Label>
            {autoStatus ? (
              <Input value={`${autoStatus} (auto — in serviceable store)`} readOnly disabled className="text-text-secondary" />
            ) : (
              <Select name="status" value={status} onValueChange={setStatus} disabled={!canEdit}>
                <SelectTrigger>
                  <SelectValue placeholder="— unset —" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="planFinishDate">Plan finish date</Label>
            <Input
              id="planFinishDate"
              type="date"
              name="planFinishDate"
              defaultValue={base.planFinishDate ?? ""}
              disabled={!canEdit}
              className="data-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={base.location ?? ""} disabled={!canEdit} />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <Label htmlFor="remark">Remark</Label>
            <textarea
              id="remark"
              name="remark"
              defaultValue={base.remark ?? ""}
              disabled={!canEdit}
              rows={2}
              className="flex w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {error && <p className="text-sm text-status-urgent md:col-span-2">{error}</p>}
        </form>

        <DialogFooter>
          <div>
            {canEdit &&
              !isNew &&
              (confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Delete this order?</span>
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
                <Button type="submit" disabled={pending} onClick={() => formRef.current?.requestSubmit()}>
                  {pending ? "Saving…" : isNew ? "Create order" : "Save"}
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
