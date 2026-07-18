"use client";

import { useRef, useState, useTransition } from "react";
import { deriveUic } from "@/lib/wc-uic-map";
import { BARCODE_STATUSES } from "@/lib/shift-status";
import { useToast } from "@/components/toast";
import { createDailyMenuEntry, lookupDailyMenuOrder } from "./actions";

interface OrderLookup {
  description: string | null;
  serialNumber: string | null;
  engineType: string | null;
  mwcToday: string | null;
}

export function DailyMenuEntryForm({ menuDate, shift }: { menuDate: string; shift: string }) {
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [lookup, setLookup] = useState<OrderLookup | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [workCenter, setWorkCenter] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const request = useRef(0);
  const derivedUic = deriveUic(workCenter);

  async function handleOrderBlur(value: string) {
    const id = ++request.current;
    setOrderNumber(value);
    setLookup(null);
    setMessage(value ? "Looking up order…" : null);
    if (!value) return;
    const result = await lookupDailyMenuOrder(value);
    if (id !== request.current) return;
    setLookup(result);
    setWorkCenter(result?.mwcToday ?? "");
    setMessage(result ? null : "Order not found or archived.");
  }

  function submit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await createDailyMenuEntry(formData);
        showToast("Entry added");
        formRef.current?.reset();
        setOrderNumber(""); setLookup(null); setWorkCenter("");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to add entry.");
      }
    });
  }

  return (
    <form ref={formRef} action={submit} className="bg-surface-solid grid grid-cols-1 gap-3 rounded-lg border border-border p-5 md:grid-cols-4">
      <input type="hidden" name="menuDate" value={menuDate} />
      <input type="hidden" name="shift" value={shift} />
      <Field label="Order number">
        <input name="orderNumber" value={orderNumber} required autoFocus onChange={(e) => { setOrderNumber(e.target.value); setLookup(null); setMessage(e.target.value ? "Press Tab to validate this order." : null); }} onBlur={(e) => handleOrderBlur(e.target.value)} className="field-input data-mono" />
      </Field>
      <Field label="Work center">
        <input name="workCenter" value={workCenter} onChange={(e) => setWorkCenter(e.target.value)} className="field-input" />
      </Field>
      <Field label="UIC (derived)"><input value={derivedUic ?? "-"} readOnly className="field-input text-text-secondary" /><input type="hidden" name="uic" value={derivedUic ?? ""} /></Field>
      <Field label="Ops"><input name="ops" className="field-input data-mono" /></Field>
      <div className="md:col-span-4 text-sm text-text-secondary">{message ?? (lookup ? `${lookup.description ?? "-"} · ${lookup.serialNumber ?? "-"} · ${lookup.engineType ?? "-"}` : "Select an order from the Orders table.")}</div>
      <div className="md:col-span-4"><Field label="Activity"><textarea name="activity" rows={2} className="field-input" /></Field></div>
      <Field label="Manhours"><input name="planMhrs" type="number" step="0.5" className="field-input data-mono" /></Field>
      <Field label="Progress %"><input name="progressPct" type="number" min={0} max={100} className="field-input data-mono" /></Field>
      <Field label="Stamp">
        <label className="flex h-[38px] items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm">
          <input name="stamp" type="checkbox" className="h-4 w-4 accent-[var(--accent)]" />
          <span className="text-text-secondary">Stamped</span>
        </label>
      </Field>
      <Field label="Barcode status">
        <select name="completenessStatus" defaultValue="Open" className="field-input">
          {BARCODE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Remark"><input name="remark" className="field-input" /></Field>
      <div className="md:col-span-4 flex justify-end"><button type="submit" disabled={pending || !lookup} className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60">{pending ? "Saving…" : "Add entry"}</button></div>
      <style jsx>{`.field-input { width: 100%; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); padding: 8px 12px; font-size: 14px; color: var(--text-primary); } .field-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-bg); }`}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="flex flex-col gap-1"><span className="text-xs font-medium text-text-secondary">{label}</span>{children}</div>; }
