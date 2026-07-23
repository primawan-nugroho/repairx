"use client";

import { useRef, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deriveUic } from "@/lib/wc-uic-map";
import { useToast } from "@/components/toast";
import { createDailyMenuEntry, lookupDailyMenuOrder } from "./actions";

interface OrderLookup {
  description: string | null;
  serialNumber: string | null;
  engineType: string | null;
  mwcToday: string | null;
}

export function DailyMenuEntryForm({
  menuDate,
  shift,
  workCenterToUic,
}: {
  menuDate: string;
  shift: string;
  workCenterToUic: Record<string, string>;
}) {
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [lookup, setLookup] = useState<OrderLookup | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [workCenter, setWorkCenter] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const request = useRef(0);
  const derivedUic = deriveUic(workCenter, workCenterToUic);

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
        setOrderNumber("");
        setLookup(null);
        setWorkCenter("");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to add entry.");
      }
    });
  }

  return (
    <Card asChild>
      <form ref={formRef} action={submit} className="grid grid-cols-1 gap-3 p-5 md:grid-cols-4">
        <input type="hidden" name="menuDate" value={menuDate} />
        <input type="hidden" name="shift" value={shift} />
        <input type="hidden" name="uic" value={derivedUic ?? ""} />

        <div className="flex flex-col gap-1">
          <Label htmlFor="orderNumber">Order number</Label>
          <Input
            id="orderNumber"
            name="orderNumber"
            value={orderNumber}
            required
            autoFocus
            onChange={(e) => {
              setOrderNumber(e.target.value);
              setLookup(null);
              setMessage(e.target.value ? "Press Tab to validate this order." : null);
            }}
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

        <div className="text-sm text-text-secondary md:col-span-4">
          {message ??
            (lookup
              ? `${lookup.description ?? "-"} · ${lookup.serialNumber ?? "-"} · ${lookup.engineType ?? "-"}`
              : "Select an order from the Orders table.")}
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
          <Label htmlFor="planMhrs">Manhours</Label>
          <Input id="planMhrs" name="planMhrs" type="number" step="0.5" className="data-mono" />
        </div>
        <div className="flex flex-col gap-1 md:col-span-3">
          <Label htmlFor="remark">Remark</Label>
          <Input id="remark" name="remark" />
        </div>

        <div className="flex justify-end md:col-span-4">
          <Button type="submit" disabled={pending || !lookup}>
            {pending ? "Saving…" : "Add entry"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
