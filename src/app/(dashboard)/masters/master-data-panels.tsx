"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EngineTypeRow, UicTeamRow, WorkCenterRow } from "@/db/schema";
import { CATEGORICAL_COLOR_CLASSES } from "@/components/uic-badge";
import {
  createEngineType,
  setEngineTypeActive,
  createUicTeam,
  setUicTeamActive,
  setTerminalUicTeam,
  clearTerminalUicTeam,
  createWorkCenter,
  updateWorkCenterUicTeam,
  setWorkCenterActive,
} from "./master-data-actions";

function ErrorLine({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="text-xs text-status-urgent">{error}</p>;
}

export function EngineTypesPanel({ rows }: { rows: EngineTypeRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      try {
        await createEngineType(name);
        setName("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function toggle(row: EngineTypeRow) {
    startTransition(async () => {
      await setEngineTypeActive(row.id, !row.active);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 data-mono">{r.name}</td>
                <td className="px-3 py-2">
                  <StatusPill active={r.active} />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => toggle(r)}
                    disabled={pending}
                    className="text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40"
                  >
                    {r.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New engine type, e.g. CFM56-7B"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg"
        />
        <button
          onClick={handleAdd}
          disabled={pending || !name.trim()}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-text-primary disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <ErrorLine error={error} />
    </div>
  );
}

export function UicTeamsPanel({ rows }: { rows: UicTeamRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      try {
        await createUicTeam(name);
        setName("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function toggle(row: UicTeamRow) {
    startTransition(async () => {
      await setUicTeamActive(row.id, !row.active);
      router.refresh();
    });
  }

  function makeTerminal(row: UicTeamRow) {
    startTransition(async () => {
      try {
        if (row.isTerminal) {
          await clearTerminalUicTeam();
        } else {
          await setTerminalUicTeam(row.id);
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-text-tertiary">
        The team flagged &ldquo;Terminal&rdquo; means the repair is finished and the part is in the
        serviceable store — its Status auto-derives to &ldquo;Ready&rdquo; and it&rsquo;s excluded from
        workload views. Only one team can be terminal at a time.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Color</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Terminal</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 data-mono">{r.name}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORICAL_COLOR_CLASSES[r.colorSlug] ?? ""}`}
                  >
                    {r.colorSlug}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => makeTerminal(r)}
                    disabled={pending}
                    className={
                      r.isTerminal
                        ? "rounded-full bg-status-closed/15 px-2.5 py-0.5 text-xs font-medium text-status-closed"
                        : "text-xs font-medium text-text-secondary hover:text-text-primary"
                    }
                  >
                    {r.isTerminal ? "✓ Terminal" : "Set as terminal"}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <StatusPill active={r.active} />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => toggle(r)}
                    disabled={pending}
                    className="text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40"
                  >
                    {r.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New UIC team, e.g. TVU-5"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg"
        />
        <button
          onClick={handleAdd}
          disabled={pending || !name.trim()}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-text-primary disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <ErrorLine error={error} />
    </div>
  );
}

export function WorkCentersPanel({ rows, uicTeams }: { rows: WorkCenterRow[]; uicTeams: UicTeamRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [uicTeamId, setUicTeamId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const uicNameById = new Map(uicTeams.map((t) => [t.id, t.name]));

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      try {
        await createWorkCenter(code, uicTeamId ? Number(uicTeamId) : null);
        setCode("");
        setUicTeamId("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function toggle(row: WorkCenterRow) {
    startTransition(async () => {
      await setWorkCenterActive(row.id, !row.active);
      router.refresh();
    });
  }

  function reassign(row: WorkCenterRow, value: string) {
    startTransition(async () => {
      await updateWorkCenterUicTeam(row.id, value ? Number(value) : null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Code</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">UIC team</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 data-mono">{r.code}</td>
                <td className="px-3 py-2">
                  <select
                    value={r.uicTeamId ?? ""}
                    onChange={(e) => reassign(r, e.target.value)}
                    disabled={pending}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text-primary"
                  >
                    <option value="">— unmapped —</option>
                    {uicTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {r.uicTeamId && !uicNameById.has(r.uicTeamId) && (
                    <span className="ml-2 text-xs text-status-urgent">unknown team</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <StatusPill active={r.active} />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => toggle(r)}
                    disabled={pending}
                    className="text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40"
                  >
                    {r.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="New work center code, e.g. MR"
          className="w-56 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg"
        />
        <select
          value={uicTeamId}
          onChange={(e) => setUicTeamId(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="">— unmapped —</option>
          {uicTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={pending || !code.trim()}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-text-primary disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <ErrorLine error={error} />
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-full bg-status-closed/15 px-2.5 py-0.5 text-xs font-medium text-status-closed"
          : "rounded-full bg-status-open/15 px-2.5 py-0.5 text-xs font-medium text-status-open"
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
