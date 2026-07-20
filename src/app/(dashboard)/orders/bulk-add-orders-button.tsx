"use client";

import { useState } from "react";
import type { OrderMasters } from "@/lib/masters";
import { BulkAddOrdersDialog } from "./bulk-add-orders-dialog";

export function BulkAddOrdersButton({ masters }: { masters: OrderMasters }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-border px-5 py-2 text-sm font-medium text-text-primary hover:border-border-strong"
      >
        Add multiple
      </button>
      {open && <BulkAddOrdersDialog masters={masters} onClose={() => setOpen(false)} />}
    </>
  );
}
