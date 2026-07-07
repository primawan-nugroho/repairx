"use client";

import { useState } from "react";
import { UicBadge } from "@/components/uic-badge";
import { StatusBadge } from "@/components/status-badge";
import { groupByUic } from "@/lib/shift-report";
import { EntryEditDialog } from "./entry-edit-dialog";
import type { EditableShiftEntry } from "./types";

interface GroupedEntriesViewProps {
  entries: EditableShiftEntry[];
  canEdit: boolean;
  onSave: (id: number, formData: FormData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  emptyMessage: string;
}

export function GroupedEntriesView({ entries, canEdit, onSave, onDelete, emptyMessage }: GroupedEntriesViewProps) {
  const [editing, setEditing] = useState<EditableShiftEntry | null>(null);
  const grouped = groupByUic(entries);

  return (
    <div className="flex flex-col gap-6">
      {grouped.length === 0 && <p className="text-sm text-text-secondary">{emptyMessage}</p>}
      {grouped.map(([uic, groupEntries]) => (
        <div key={uic} className="rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-2 bg-surface px-3 py-2">
            <UicBadge uic={uic === "Unassigned" ? null : uic} />
            {uic === "Unassigned" && <span className="text-xs font-medium text-text-secondary">Unassigned</span>}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-text-secondary">
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Ops</th>
                <th className="px-3 py-2">Activity</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Manhours</th>
                <th className="px-3 py-2">Status</th>
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
                  <td className="px-3 py-2 data-mono">{e.ops}</td>
                  <td className="px-3 py-2 max-w-[320px]">
                    <span className="line-clamp-1">{e.activity}</span>
                  </td>
                  <td className="px-3 py-2 data-mono">{e.progressPct ?? 0}%</td>
                  <td className="px-3 py-2 data-mono">{e.manhours ?? 0}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={e.completenessStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {editing && (
        <EntryEditDialog
          entry={editing}
          canEdit={canEdit}
          onSave={onSave}
          onDelete={onDelete}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
