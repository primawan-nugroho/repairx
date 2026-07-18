"use client";

import { useRef, useState, useTransition } from "react";
import { createShiftReportEntry, lookupOrderAction } from "./actions";
import { deriveUic } from "@/lib/wc-uic-map";
import { BARCODE_STATUSES } from "@/lib/shift-status";
import { useToast } from "@/components/toast";

interface OrderLookup {
  description: string | null;
  serialNumber: string | null;
  engineType: string | null;
  uicToday: string | null;
  mwcToday: string | null;
}

export function ShiftEntryForm({ reportDate, shift }: { reportDate: string; shift: string }) {
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [lookup, setLookup] = useState<OrderLookup | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [workCenter, setWorkCenter] = useState("");
  const [pending, startTransition] = useTransition();

  const derivedUic = deriveUic(workCenter);

  async function handleOrderBlur(orderNumber: string) {
    if (!orderNumber) {
      setLookup(null);
      setNotFound(false);
      return;
    }
    const result = await lookupOrderAction(orderNumber);
    setLookup(result);
    setNotFound(!result);
    setWorkCenter(result?.mwcToday ?? "");
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await createShiftReportEntry(formData);
          showToast("Entry added");
          formRef.current?.reset();
          setLookup(null);
          setNotFound(false);
          setWorkCenter("");
        });
      }}
      className="bg-surface-solid grid grid-cols-1 gap-3 rounded-lg border border-border p-5 md:grid-cols-4"
    >
      <input type="hidden" name="reportDate" value={reportDate} />
      <input type="hidden" name="shift" value={shift} />

      <Field label="Order number">
        <input
          name="orderNumber"
          required
          autoFocus
          onBlur={(e) => handleOrderBlur(e.target.value)}
          className="field-input data-mono"
        />
      </Field>

      <Field label="Work center">
        <input
          name="workCenter"
          value={workCenter}
          onChange={(e) => setWorkCenter(e.target.value)}
          className="field-input"
        />
      </Field>

      <Field label="UIC (derived)">
        <input
          value={derivedUic ?? "-"}
          readOnly
          disabled
          className="field-input text-text-secondary"
        />
        <input type="hidden" name="uic" value={derivedUic ?? ""} />
      </Field>

      <Field label="Ops">
        <input name="ops" className="field-input data-mono" />
      </Field>

      <div className="md:col-span-4 flex flex-col gap-1">
        <span className="text-xs font-medium text-text-secondary">
          Description / serial / engine (auto-filled)
        </span>
        <span className="text-sm text-text-secondary">
          {notFound
            ? "Order not found in database — entry will still be saved, flagged for review."
            : lookup
              ? `${lookup.description ?? "-"} · ${lookup.serialNumber ?? "-"} · ${lookup.engineType ?? "-"}`
              : "Enter an order number and tab out to auto-fill"}
        </span>
      </div>

      <div className="md:col-span-4">
        <Field label="Activity">
          <textarea name="activity" rows={2} className="field-input" />
        </Field>
      </div>

      <Field label="Progress %">
        <input name="progressPct" type="number" min={0} max={100} className="field-input data-mono" />
      </Field>

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
      <div className="md:col-span-2">
        <Field label="Remark">
          <input name="remark" className="field-input" />
        </Field>
      </div>

      <div className="md:col-span-4 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Add entry"}
        </button>
      </div>

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
      `}</style>
    </form>
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
