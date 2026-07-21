"use client";

import { useState } from "react";
import { PlannerEntryDialog } from "./planner-entry-dialog";

export function AddEntryButton({
  engineTypes,
  rpcNames,
  eoNames,
}: {
  engineTypes: string[];
  rpcNames: string[];
  eoNames: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white"
      >
        Add entry
      </button>
      {open && (
        <PlannerEntryDialog
          canEdit
          onClose={() => setOpen(false)}
          engineTypes={engineTypes}
          rpcNames={rpcNames}
          eoNames={eoNames}
        />
      )}
    </>
  );
}
