"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
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
import type { RepairPlannerEntry } from "@/db/schema";
import { isEngineType } from "@/lib/engine-types";
import { PLANNER_STATUSES } from "@/lib/planner-status";
import { useDialogShortcuts } from "@/lib/use-dialog-shortcuts";
import { useToast } from "@/components/toast";
import { archiveRepairPlannerEntry, createRepairPlannerEntry, updateRepairPlannerEntry } from "./actions";

interface PlannerEntryDialogProps {
  entry?: RepairPlannerEntry;
  canEdit: boolean;
  onClose: () => void;
  /** Canonical engine/APU type list (see lib/masters.ts) — distinct from any
   * column-filter option list, which is just the values already present in this
   * table's own rows. */
  engineTypes: string[];
  rpcNames: string[];
  eoNames: string[];
}

const BLANK: Partial<RepairPlannerEntry> = {};

/** Renders a select for a canonical-list field, preserving an existing value that
 * isn't (or is no longer) in the list as a disabled "current" option — so saving the
 * form without touching this field never silently wipes a legacy value that predates
 * the canonical list (e.g. a name removed from Masters, or an old free-text status). */
function CanonicalSelect({
  name,
  value,
  options,
  disabled,
  onChange,
}: {
  name: string;
  value: string;
  options: string[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const hasLegacyValue = value && !options.includes(value);
  return (
    <Select name={name} value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="— unset —" />
      </SelectTrigger>
      <SelectContent>
        {hasLegacyValue && (
          <SelectItem value={value} disabled>
            {value} (not in list)
          </SelectItem>
        )}
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PlannerEntryDialog({ entry, canEdit, onClose, engineTypes, rpcNames, eoNames }: PlannerEntryDialogProps) {
  const isNew = !entry;
  const base = entry ?? BLANK;
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [engineApu, setEngineApu] = useState(base.engineApu ?? "");
  const [engineType, setEngineType] = useState(isEngineType(base.engineType, engineTypes) ? base.engineType : "");
  const [eo, setEo] = useState(base.eo ?? "");
  const [rpc1, setRpc1] = useState(base.rpc1 ?? "");
  const [rpc2, setRpc2] = useState(base.rpc2 ?? "");
  const [gate4Status, setGate4Status] = useState(base.gate4Status ?? "");
  const [projectStatus, setProjectStatus] = useState(base.projectStatus ?? "");

  useDialogShortcuts(formRef, onClose, canEdit && !confirmingDelete);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (isNew) {
          await createRepairPlannerEntry(formData);
          showToast("Entry created");
        } else {
          await updateRepairPlannerEntry(entry!.id, formData);
          showToast("Entry saved");
        }
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  function handleDelete() {
    if (!entry) return;
    setError(null);
    startTransition(async () => {
      try {
        await archiveRepairPlannerEntry(entry.id);
        showToast("Entry deleted");
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl gap-0 p-0"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isNew ? "Add repair planner entry" : `${base.serialNumber ?? "Entry"}`}</DialogTitle>
        </DialogHeader>

        <form
          ref={formRef}
          action={handleSubmit}
          className="grid grid-cols-1 gap-2.5 overflow-y-auto px-5 py-4 md:grid-cols-2"
        >
          <div className="flex flex-col gap-1">
            <Label>Engine/APU</Label>
            <Select name="engineApu" value={engineApu} onValueChange={setEngineApu} disabled={!canEdit}>
              <SelectTrigger>
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Engine">Engine</SelectItem>
                <SelectItem value="APU">APU</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="customer">Customer</Label>
            <Input id="customer" name="customer" defaultValue={base.customer ?? ""} disabled={!canEdit} />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Type</Label>
            <Select name="engineType" value={engineType} onValueChange={setEngineType} disabled={!canEdit}>
              <SelectTrigger>
                <SelectValue placeholder="— unset —" />
              </SelectTrigger>
              <SelectContent>
                {engineTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="serialNumber">Serial number</Label>
            <Input
              id="serialNumber"
              name="serialNumber"
              defaultValue={base.serialNumber ?? ""}
              disabled={!canEdit}
              className="data-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>EO</Label>
            <CanonicalSelect name="eo" value={eo} options={eoNames} disabled={!canEdit} onChange={setEo} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="inductionDate">Induction date</Label>
            <Input
              id="inductionDate"
              type="date"
              name="inductionDate"
              defaultValue={base.inductionDate ?? ""}
              disabled={!canEdit}
              className="data-mono"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label htmlFor="workscope">Workscope</Label>
            <Input id="workscope" name="workscope" defaultValue={base.workscope ?? ""} disabled={!canEdit} />
          </div>

          <div className="flex flex-col gap-1">
            <Label>RPC-1</Label>
            <CanonicalSelect name="rpc1" value={rpc1} options={rpcNames} disabled={!canEdit} onChange={setRpc1} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>RPC-2</Label>
            <CanonicalSelect name="rpc2" value={rpc2} options={rpcNames} disabled={!canEdit} onChange={setRpc2} />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Gate 4 status</Label>
            <CanonicalSelect
              name="gate4Status"
              value={gate4Status}
              options={[...PLANNER_STATUSES]}
              disabled={!canEdit}
              onChange={setGate4Status}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Project status</Label>
            <CanonicalSelect
              name="projectStatus"
              value={projectStatus}
              options={[...PLANNER_STATUSES]}
              disabled={!canEdit}
              onChange={setProjectStatus}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label htmlFor="remark">Remark</Label>
            <textarea
              id="remark"
              name="remark"
              defaultValue={base.remark ?? ""}
              disabled={!canEdit}
              rows={2}
              className="flex w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {error && <p className="text-sm text-status-urgent md:col-span-2">{error}</p>}
        </form>

        <DialogFooter>
          <div>
            {canEdit &&
              !isNew &&
              (confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Delete this entry?</span>
                  <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
                    {pending ? "Deleting…" : "Confirm delete"}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmingDelete(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className="border-status-urgent text-status-urgent"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </Button>
              ))}
          </div>

          {!confirmingDelete && (
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={onClose}>
                {canEdit ? "Cancel" : "Close"}
              </Button>
              {canEdit && (
                <Button type="submit" disabled={pending} onClick={() => formRef.current?.requestSubmit()}>
                  {pending ? "Saving…" : isNew ? "Create entry" : "Save"}
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
