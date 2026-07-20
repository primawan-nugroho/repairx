import Link from "next/link";
import { auth } from "@/lib/auth";
import { getShiftReportEntries, summarize } from "@/lib/shift-report";
import { getMasters } from "@/lib/masters";
import { ShiftEntryForm } from "./entry-form";
import { GroupedEntriesView } from "@/components/shift-entries/grouped-entries-view";
import { currentShift } from "@/lib/shift";
import { updateShiftReportEntry, archiveShiftReportEntry } from "./actions";

interface PageProps {
  searchParams: Promise<{ date?: string; shift?: string }>;
}

function todayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export default async function ShiftReportPage({ searchParams }: PageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const reportDate = params.date || todayIso();
  const shift = params.shift || currentShift();

  const [entries, masters] = await Promise.all([getShiftReportEntries(reportDate, shift), getMasters()]);
  const summary = summarize(entries);
  const canEdit = Boolean(session && session.user.role !== "viewer");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">End shift report</h1>
        <Link
          href={`/print/shift-report?date=${reportDate}&shift=${shift}`}
          target="_blank"
          className="rounded-full border border-border px-5 py-2 text-xs font-medium text-text-primary hover:border-border-strong"
        >
          Export / print
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3" action="/shift-report">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-secondary">Date</span>
          <input
            type="date"
            name="date"
            defaultValue={reportDate}
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

      {canEdit && <ShiftEntryForm reportDate={reportDate} shift={shift} workCenterToUic={masters.workCenterToUic} />}

      <div className="bg-surface-solid flex gap-6 rounded-lg border border-border p-4">
        <Stat label="Entries" value={summary.totalEntries} />
        <Stat label="Closed" value={summary.closedCount} />
      </div>

      <GroupedEntriesView
        entries={entries}
        canEdit={canEdit}
        showManhours={false}
        onSave={updateShiftReportEntry}
        onDelete={archiveShiftReportEntry}
        emptyMessage="No entries logged for this date/shift yet."
        masters={masters}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <span className="data-mono text-2xl font-semibold text-text-primary">{value}</span>
    </div>
  );
}
