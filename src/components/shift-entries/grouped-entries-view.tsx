"use client";

import { useState, useTransition } from "react";
import type { OrderMasters } from "@/lib/masters";
import { UicBadge } from "@/components/uic-badge";
import { StatusBadge } from "@/components/status-badge";
import { groupByUic } from "@/lib/shift-report";
import { cn, progressColorKey } from "@/lib/utils";
import { EntryEditDialog } from "./entry-edit-dialog";
import type { EditableShiftEntry } from "./types";

interface GroupedEntriesViewProps {
  entries: EditableShiftEntry[];
  canEdit: boolean;
  showManhours?: boolean;
  onSave: (id: number, formData: FormData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  emptyMessage: string;
  masters: OrderMasters;
}

export function GroupedEntriesView({
  entries,
  canEdit,
  showManhours = true,
  onSave,
  onDelete,
  emptyMessage,
  masters,
}: GroupedEntriesViewProps) {
  const [editing, setEditing] = useState<EditableShiftEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const grouped = groupByUic(entries);

  // The list has both a pencil (opens the shared edit dialog) and a trash affordance
  // per row so the user doesn't have to open the dialog just to confirm they want to
  // delete. The trash uses the same confirm-in-place flow the dialog itself already
  // has, so accidental double-clicks don't nuke rows.
  const columnCount = 9 + (showManhours ? 1 : 0) + (canEdit ? 1 : 0);

  function handleDelete(id: number) {
    startTransition(async () => {
      try {
        await onDelete(id);
      } finally {
        setConfirmDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {grouped.length === 0 && <p className="text-sm text-text-secondary">{emptyMessage}</p>}
      {grouped.map(([uic, groupEntries]) => {
        const finalCount = groupEntries.filter((e) => {
          const s = e.completenessStatus?.toLowerCase();
          return s === "closed" || s === "final confirm";
        }).length;
        const avgProgress = groupEntries.length
          ? Math.round(
              groupEntries.reduce((sum, e) => sum + (e.progressPct ?? 0), 0) / groupEntries.length,
            )
          : 0;

        return (
          <div key={uic} className="rounded-lg border border-border overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 bg-surface px-3 py-2">
              <UicBadge uic={uic === "Unassigned" ? null : uic} uicColorSlugs={masters.uicColorSlugs} />
              {uic === "Unassigned" && <span className="text-xs font-medium text-text-secondary">Unassigned</span>}
              <span className="data-mono text-xs text-text-secondary">
                {groupEntries.length} {groupEntries.length === 1 ? "entry" : "entries"} · {finalCount} final · avg{" "}
                {avgProgress}%
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium text-text-secondary">
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Serial</th>
                    <th className="px-3 py-2">Engine</th>
                    <th className="px-3 py-2">Ops</th>
                    <th className="px-3 py-2">Activity</th>
                    {showManhours && <th className="px-3 py-2">Manhours</th>}
                    <th className="px-3 py-2">Progress</th>
                    <th className="px-3 py-2">Stamp</th>
                    <th className="px-3 py-2">Barcode status</th>
                    {canEdit && <th className="px-3 py-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {groupEntries.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 data-mono">
                        <button onClick={() => setEditing(e)} className="text-accent hover:underline">
                          {e.orderNumber}
                        </button>
                      </td>
                      <td className="px-3 py-2 max-w-[220px]">
                        <span className="line-clamp-1">{e.orderDescription || "-"}</span>
                      </td>
                      <td className="px-3 py-2 data-mono">{e.orderSerialNumber || "-"}</td>
                      <td className="px-3 py-2">{e.orderEngineType || "-"}</td>
                      <td className="px-3 py-2 data-mono">{e.ops}</td>
                      <td className="px-3 py-2 max-w-[320px]">
                        <span className="line-clamp-1">{e.activity}</span>
                      </td>
                      {showManhours && <td className="px-3 py-2 data-mono">{e.planMhrs ?? 0}</td>}
                      <td className="px-3 py-2">
                        <ProgressBadge pct={e.progressPct} />
                      </td>
                      <td className="px-3 py-2">
                        <StampBadge stamped={e.stamp} />
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={e.completenessStatus} />
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2">
                          {confirmDeleteId === e.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-text-secondary">Delete?</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(e.id)}
                                disabled={pending}
                                className="rounded-full bg-status-urgent px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
                              >
                                {pending ? "…" : "Yes"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-full border border-border px-2.5 py-1 text-xs text-text-secondary"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditing(e)}
                                aria-label="Edit entry"
                                title="Edit"
                                className="rounded p-1.5 text-text-secondary hover:bg-surface hover:text-text-primary"
                              >
                                <PencilIcon />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(e.id)}
                                aria-label="Delete entry"
                                title="Delete"
                                className="rounded p-1.5 text-text-secondary hover:bg-surface hover:text-status-urgent"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {groupEntries.length === 0 && (
                    <tr>
                      <td colSpan={columnCount} className="px-3 py-4 text-center text-text-secondary">
                        No entries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {editing && (
        <EntryEditDialog
          entry={editing}
          canEdit={canEdit}
          showManhours={showManhours}
          onSave={onSave}
          onDelete={onDelete}
          onClose={() => setEditing(null)}
          workCenterToUic={masters.workCenterToUic}
        />
      )}
    </div>
  );
}

const PROGRESS_COLOR_CLASSES: Record<string, string> = {
  "status-open": "bg-status-open/15 text-status-open",
  "status-progress": "bg-status-progress/15 text-status-progress",
  "status-closed": "bg-status-closed/15 text-status-closed",
  "status-waiting": "bg-status-waiting/15 text-status-waiting",
  "status-urgent": "bg-status-urgent/15 text-status-urgent",
};

/** Conditional formatting for progress: color band communicates at a glance
 * whether a job is behind, on track, or done — see progressColorKey. */
function ProgressBadge({ pct }: { pct: number | null | undefined }) {
  const key = progressColorKey(pct);
  return (
    <span
      className={cn(
        "data-mono inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        PROGRESS_COLOR_CLASSES[key],
      )}
    >
      {pct ?? 0}%
    </span>
  );
}

function StampBadge({ stamped }: { stamped: boolean }) {
  return (
    <span
      className={
        stamped
          ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-status-closed/15 px-2 text-xs font-medium text-status-closed"
          : "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface px-2 text-xs text-text-secondary"
      }
    >
      {stamped ? "✓" : "—"}
    </span>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10-4-4L4 16v4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    </svg>
  );
}
