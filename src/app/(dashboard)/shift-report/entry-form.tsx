"use client";

import { useRef, useState, useTransition } from "react";
import { createShiftReportEntry, lookupOrderAction } from "./actions";
import { Card } from "@/components/ui/card";
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

export function ShiftEntryForm({
  reportDate,
  shift,
  workCenterToUic,
}: {
  reportDate: string;
  shift: string;
  workCenterToUic: Record<string, string>;
}) {
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [lookup, setLookup] = useState<OrderLookup | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [workCenter, setWorkCenter] = useState("");
  const [completenessStatus, setCompletenessStatus] = useState("Open");
  const [pending, startTransition] = useTransition();

  const derivedUic = deriveUic(workCenter, workCenterToUic);

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
    <Card asChild>
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
            setCompletenessStatus("Open");
          });
        }}
        className="grid grid-cols-1 gap-3 p-5 md:grid-cols-4"
      >
        <input type="hidden" name="reportDate" value={reportDate} />
        <input type="hidden" name="shift" value={shift} />
        <input type="hidden" name="uic" value={derivedUic ?? ""} />
        <input type="hidden" name="completenessStatus" value={completenessStatus} />

        <div className="flex flex-col gap-1">
          <Label htmlFor="orderNumber">Order number</Label>
          <Input
            id="orderNumber"
            name="orderNumber"
            required
            autoFocus
            onBlur={(e) => handleOrderBlur(e.target.value)}
            className="data-mono"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="workCenter">Work center</Label>
          <Input id="workCenter" name="workCenter" value={workCenter} onChange={(e) => setWorkCenter(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1">
          <Label>UIC (derived)</Label>
          <Input value={derivedUic ?? "-"} readOnly disabled className="text-text-secondary" />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="ops">Ops</Label>
          <Input id="ops" name="ops" className="data-mono" />
        </div>

        <div className="flex flex-col gap-1 md:col-span-4">
          <Label>Description / serial / engine (auto-filled)</Label>
          <span className="text-sm text-text-secondary">
            {notFound
              ? "Order not found in database — entry will still be saved, flagged for review."
              : lookup
                ? `${lookup.description ?? "-"} · ${lookup.serialNumber ?? "-"} · ${lookup.engineType ?? "-"}`
                : "Enter an order number and tab out to auto-fill"}
          </span>
        </div>

        <div className="flex flex-col gap-1 md:col-span-4">
          <Label htmlFor="activity">Activity</Label>
          <textarea
            id="activity"
            name="activity"
            rows={2}
            className="flex w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="progressPct">Progress %</Label>
          <Input id="progressPct" name="progressPct" type="number" min={0} max={100} className="data-mono" />
        </div>

        <div className="flex flex-col gap-1">
          <Label>Stamp</Label>
          <label className="flex h-9 items-center gap-2 rounded-sm border border-border bg-surface px-3 text-sm">
            <input name="stamp" type="checkbox" className="h-4 w-4 accent-[var(--accent)]" />
            <span className="text-text-secondary">Stamped</span>
          </label>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Barcode status</Label>
          <Select value={completenessStatus} onValueChange={setCompletenessStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BARCODE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <Label htmlFor="remark">Remark</Label>
          <Input id="remark" name="remark" />
        </div>

        <div className="flex justify-end md:col-span-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Add entry"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
