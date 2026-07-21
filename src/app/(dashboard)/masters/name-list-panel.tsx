"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface NamedRow {
  id: number;
  name: string;
}

/** Shared UI for a plain "list of names" master table with real add/edit/delete
 * (no active/inactive toggle — used for RPC people and Engine Owners, both plain
 * free-text fields with no FK, so deleting a name can never orphan a reference). */
export function NameListPanel({
  rows,
  addPlaceholder,
  onCreate,
  onUpdate,
  onDelete,
}: {
  rows: NamedRow[];
  addPlaceholder: string;
  onCreate: (name: string) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      try {
        await onCreate(newName);
        setNewName("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function startEdit(row: NamedRow) {
    setEditingId(row.id);
    setEditValue(row.name);
    setError(null);
  }

  function saveEdit(id: number) {
    setError(null);
    startTransition(async () => {
      try {
        await onUpdate(id, editValue);
        setEditingId(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function handleDelete(id: number) {
    setError(null);
    startTransition(async () => {
      try {
        await onDelete(id);
        setConfirmDeleteId(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 data-mono">
                  {editingId === r.id ? (
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text-primary outline-none focus:border-accent"
                    />
                  ) : (
                    r.name
                  )}
                </td>
                <td className="px-3 py-2">
                  {editingId === r.id ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => saveEdit(r.id)}
                        disabled={pending || !editValue.trim()}
                        className="text-xs font-medium text-accent hover:underline disabled:opacity-40"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs font-medium text-text-secondary hover:text-text-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : confirmDeleteId === r.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">Delete?</span>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={pending}
                        className="rounded-full bg-status-urgent px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
                      >
                        {pending ? "…" : "Yes"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-full border border-border px-2.5 py-1 text-xs text-text-secondary"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => startEdit(r)}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(r.id)}
                        className="text-xs font-medium text-text-secondary hover:text-status-urgent"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={2} className="px-3 py-4 text-center text-text-secondary">
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={addPlaceholder}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg"
        />
        <button
          onClick={handleAdd}
          disabled={pending || !newName.trim()}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-text-primary disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-status-urgent">{error}</p>}
    </div>
  );
}
