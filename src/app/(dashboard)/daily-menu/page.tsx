import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDailyMenuEntries, getPreviousShift } from "@/lib/daily-menu";
import { GroupedEntriesView } from "@/components/shift-entries/grouped-entries-view";
import { PopulateButton } from "./populate-button";
import { DailyMenuEntryForm } from "./entry-form";
import { updateDailyMenuEntry, archiveDailyMenuEntry } from "./actions";

interface PageProps {
  searchParams: Promise<{ date?: string; shift?: string }>;
}

function todayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export default async function DailyMenuPage({ searchParams }: PageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const menuDate = params.date || todayIso();
  const shift = params.shift || "AM";

  const entries = await getDailyMenuEntries(menuDate, shift);
  const canEdit = session?.user.role !== "viewer";
  const prev = getPreviousShift(menuDate, shift);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Daily menu</h1>
        <Link
          href={`/print/daily-menu?date=${menuDate}&shift=${shift}`}
          target="_blank"
          className="rounded-full border border-border px-5 py-2 text-xs font-medium text-text-primary hover:border-border-strong"
        >
          Export / print
        </Link>
      </div>
      <p className="-mt-4 text-sm text-text-secondary">
        Shared with production personnel before the shift starts — a plan, not the end-shift record.
      </p>

      <form className="flex flex-wrap items-end gap-3" action="/daily-menu">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-secondary">Date</span>
          <input
            type="date"
            name="date"
            defaultValue={menuDate}
            className="data-mono rounded-lg bg-surface border border-border px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-secondary">Shift</span>
          <select
            name="shift"
            defaultValue={shift}
            className="rounded-lg bg-surface border border-border px-3 py-2 text-sm"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
            <option value="Overtime">Overtime</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white"
        >
          Load
        </button>
      </form>

      {canEdit && <DailyMenuEntryForm menuDate={menuDate} shift={shift} />}

      {entries.length === 0 && canEdit && (
        <div className="bg-surface-solid flex items-center justify-between rounded-lg border border-border p-4">
          <span className="text-sm text-text-secondary">
            No menu yet for this date/shift — pull it from the previous shift ({prev.shift} on{" "}
            {prev.date}) to start from what was already logged.
          </span>
          <PopulateButton menuDate={menuDate} shift={shift} />
        </div>
      )}

      <GroupedEntriesView
        entries={entries}
        canEdit={canEdit}
        onSave={updateDailyMenuEntry}
        onDelete={archiveDailyMenuEntry}
        emptyMessage="No menu entries for this date/shift yet."
      />
    </div>
  );
}
