import Link from "next/link";
import { getShiftReportEntries, groupByWorkCenter, summarize } from "@/lib/shift-report";
import { ShiftEntryForm } from "./entry-form";
import { StatusBadge } from "@/components/status-badge";

interface PageProps {
  searchParams: Promise<{ date?: string; shift?: string }>;
}

function todayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export default async function ShiftReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const reportDate = params.date || todayIso();
  const shift = params.shift || "AM";

  const entries = await getShiftReportEntries(reportDate, shift);
  const grouped = groupByWorkCenter(entries);
  const summary = summarize(entries);

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

      <ShiftEntryForm reportDate={reportDate} shift={shift} />

      <div className="bg-surface-solid flex gap-6 rounded-lg border border-border p-4">
        <Stat label="Entries" value={summary.totalEntries} />
        <Stat label="Closed" value={summary.closedCount} />
        <Stat label="Manhours" value={summary.totalManhours} />
      </div>

      <div className="flex flex-col gap-6">
        {grouped.length === 0 && (
          <p className="text-sm text-text-secondary">No entries logged for this date/shift yet.</p>
        )}
        {grouped.map(([workCenter, groupEntries]) => (
          <div key={workCenter} className="rounded-lg border border-border overflow-hidden">
            <div className="bg-surface px-3 py-2 text-xs font-medium text-text-secondary">
              {workCenter}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-text-secondary">
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">UIC</th>
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
                    <td className="px-3 py-2 data-mono">{e.orderNumber}</td>
                    <td className="px-3 py-2">{e.uic}</td>
                    <td className="px-3 py-2 data-mono">{e.ops}</td>
                    <td className="px-3 py-2 max-w-[320px]">{e.activity}</td>
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
      </div>
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
