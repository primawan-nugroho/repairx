"use client";

import { useState } from "react";
import { OrderEditDialog } from "./order-edit-dialog";

export function AddOrderButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white"
      >
        Add order
      </button>
      {open && <OrderEditDialog canEdit onClose={() => setOpen(false)} />}
    </>
  );
}
