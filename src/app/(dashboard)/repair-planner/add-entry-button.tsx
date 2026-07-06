"use client";

import { useState } from "react";
import { PlannerEntryDialog } from "./planner-entry-dialog";

export function AddEntryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white"
      >
        Add entry
      </button>
      {open && <PlannerEntryDialog canEdit onClose={() => setOpen(false)} />}
    </>
  );
}
