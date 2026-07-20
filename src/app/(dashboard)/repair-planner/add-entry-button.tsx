"use client";

import { useState } from "react";
import { PlannerEntryDialog } from "./planner-entry-dialog";

interface DropdownOptions {
  engineType: string[];
  gate4Status: string[];
  projectStatus: string[];
  rpc1: string[];
  rpc2: string[];
}

export function AddEntryButton({
  options,
  engineTypes,
}: {
  options: DropdownOptions;
  engineTypes: string[];
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
        <PlannerEntryDialog canEdit onClose={() => setOpen(false)} options={options} engineTypes={engineTypes} />
      )}
    </>
  );
}
