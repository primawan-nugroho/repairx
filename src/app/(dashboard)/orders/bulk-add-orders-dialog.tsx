"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OrderMasters } from "@/lib/masters";
import {
  BULK_ORDER_COLUMNS,
  blankBulkOrderRow,
  parseBulkOrderText,
  type BulkOrderRow,
} from "@/lib/bulk-order-parse";
import { deriveUic } from "@/lib/wc-uic-map";
import { useToast } from "@/components/toast";
import { checkExistingOrderNumbers, createOrdersBulk } from "./actions";

interface Row extends BulkOrderRow {
  key: number;
  duplicate: boolean;
}

let nextKey = 1;

function toRow(base: BulkOrderRow): Row {
  return { ...base, key: nextKey++, duplicate: false };
}

const CELL_CLASS =
  "w-full min-w-[90px] rounded-md border border-border bg-surface px-2 py-1.5 text-[13px] text-text-primary outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-bg";

export function BulkAddOrdersDialog({ masters, onClose }: { masters: OrderMasters; onClose: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pasteText, setPasteText] = useState("");
  const [rows, setRows] = useState<Row[]>([toRow(blankBulkOrderRow())]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const checkRequest = useRef(0);

  function handleParse() {
    const parsed = parseBulkOrderText(pasteText, masters.engineTypes);
    if (parsed.length === 0) return;
    setRows(parsed.map(toRow));
    setError(null);
    void checkDuplicates(parsed.map((r) => r.orderNumber));
  }

  async function checkDuplicates(orderNumbers: string[]) {
    const id = ++checkRequest.current;
    const existing = await checkExistingOrderNumbers(orderNumbers);
    if (id !== checkRequest.current) return;
    const checkedSet = new Set(orderNumbers.map((n) => n.trim()));
    const existingSet = new Set(existing);
    // Only update rows whose number was part of this check — otherwise a single
    // row's blur-check would wipe the duplicate flag off every other row.
    setRows((current) =>
      current.map((r) => {
        const trimmed = r.orderNumber.trim();
        if (!checkedSet.has(trimmed)) return r;
        return { ...r, duplicate: existingSet.has(trimmed) };
      }),
    );
  }

  function updateRow(key: number, field: keyof BulkOrderRow, value: string) {
    setRows((current) => current.map((r) => (r.key === key ? { ...r, [field]: value, duplicate: false } : r)));
  }

  function addRow() {
    setRows((current) => [...current, toRow(blankBulkOrderRow())]);
  }

  function removeRow(key: number) {
    setRows((current) => (current.length > 1 ? current.filter((r) => r.key !== key) : current));
  }

  const inBatchDuplicates = (() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const n = r.orderNumber.trim();
      if (!n) continue;
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, c]) => c > 1).map(([n]) => n));
  })();

  const validRowCount = rows.filter(
    (r) => r.orderNumber.trim() && !r.duplicate && !inBatchDuplicates.has(r.orderNumber.trim()),
  ).length;

  function handleSave() {
    setError(null);
    const toSubmit = rows
      .filter((r) => r.orderNumber.trim())
      .map(({ key, duplicate, ...rest }) => rest);

    if (toSubmit.length === 0) {
      setError("Add at least one order number.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createOrdersBulk(toSubmit);
        const insertedSet = new Set(result.insertedOrderNumbers);
        const skippedSet = new Set(result.skippedOrderNumbers);

        if (result.insertedOrderNumbers.length > 0) {
          showToast(
            `${result.insertedOrderNumbers.length} order${result.insertedOrderNumbers.length === 1 ? "" : "s"} added` +
              (result.skippedOrderNumbers.length > 0 ? `, ${result.skippedOrderNumbers.length} skipped` : ""),
          );
        }

        if (result.skippedOrderNumbers.length === 0) {
          router.refresh();
          onClose();
          return;
        }

        // Partial success: drop inserted rows, keep skipped ones (marked duplicate)
        // so the user can see what didn't go in and fix or remove it.
        setRows((current) =>
          current
            .filter((r) => !insertedSet.has(r.orderNumber.trim()))
            .map((r) => (skippedSet.has(r.orderNumber.trim()) ? { ...r, duplicate: true } : r)),
        );
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl gap-0 p-0">
        <DialogHeader>
          <DialogTitle>Add multiple orders</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-secondary">
              Paste from Excel — columns: {BULK_ORDER_COLUMNS.join(", ")} (only Order number is required)
            </span>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste rows copied from Excel here…"
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg"
            />
            <div>
              <Button type="button" variant="secondary" size="sm" onClick={handleParse} disabled={!pasteText.trim()}>
                Parse into rows below
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-text-secondary">Order number</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-text-secondary">Description</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-text-secondary">Serial number</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-text-secondary">Engine type</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-text-secondary">Date in</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-text-secondary">Work center</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-text-secondary">UIC</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-text-secondary">Location</th>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-text-secondary">Remark</th>
                  <th className="w-8 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const trimmedNumber = row.orderNumber.trim();
                  const flagged = row.duplicate || (trimmedNumber && inBatchDuplicates.has(trimmedNumber));
                  return (
                    <tr key={row.key} className="border-t border-border">
                      <td className="px-2 py-1.5">
                        <input
                          value={row.orderNumber}
                          onChange={(e) => updateRow(row.key, "orderNumber", e.target.value)}
                          onBlur={() => trimmedNumber && checkDuplicates([trimmedNumber])}
                          className={cn(CELL_CLASS, "data-mono", flagged && "border-status-urgent")}
                          placeholder="Required"
                        />
                        {flagged && <span className="text-[10px] text-status-urgent">already exists</span>}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={row.description}
                          onChange={(e) => updateRow(row.key, "description", e.target.value)}
                          className={CELL_CLASS}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={row.serialNumber}
                          onChange={(e) => updateRow(row.key, "serialNumber", e.target.value)}
                          className={cn(CELL_CLASS, "data-mono")}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={row.engineType}
                          onChange={(e) => updateRow(row.key, "engineType", e.target.value)}
                          className={CELL_CLASS}
                        >
                          <option value="">— unset —</option>
                          {masters.engineTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="date"
                          value={row.dateIn}
                          onChange={(e) => updateRow(row.key, "dateIn", e.target.value)}
                          className={cn(CELL_CLASS, "data-mono")}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={row.workCenter}
                          onChange={(e) => updateRow(row.key, "workCenter", e.target.value)}
                          className={CELL_CLASS}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-xs text-text-secondary">
                          {deriveUic(row.workCenter, masters.workCenterToUic) ?? "-"}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={row.location}
                          onChange={(e) => updateRow(row.key, "location", e.target.value)}
                          className={CELL_CLASS}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={row.remark}
                          onChange={(e) => updateRow(row.key, "remark", e.target.value)}
                          className={CELL_CLASS}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          aria-label="Remove row"
                          title="Remove row"
                          className="rounded p-1 text-text-secondary hover:bg-surface hover:text-status-urgent"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <Button type="button" variant="secondary" size="sm" onClick={addRow}>
              + Add row
            </Button>
          </div>

          {error && <p className="text-sm text-status-urgent">{error}</p>}
        </div>

        <DialogFooter>
          <span className="text-xs text-text-secondary">
            {validRowCount} of {rows.length} rows ready to save
          </span>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={pending || validRowCount === 0}>
              {pending ? "Saving…" : `Save ${validRowCount || ""} order${validRowCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
