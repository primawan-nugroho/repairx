import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDailyMenuEntries } from "@/lib/daily-menu";
import { groupByUic } from "@/lib/shift-report";
import { formatDate } from "@/lib/utils";
import { ExportActions } from "@/app/print/shift-report/export-actions";

interface PageProps {
  searchParams: Promise<{ date?: string; shift?: string }>;
}

// Same column set/order/widths as the End Shift Report export (see
// src/app/print/shift-report/page.tsx) — the Daily Menu is the same data shape
// (see db/schema.ts: daily_menu_entries mirrors shift_report_entries), so its export
// should read identically, not as a different layout.
const COLUMN_WIDTHS = [7, 18, 9, 9, 6, 21, 8, 8, 6, 8] as const;

function ReportColgroup() {
  return (
    <colgroup>
      {COLUMN_WIDTHS.map((w, i) => (
        <col key={i} style={{ width: `${w}%` }} />
      ))}
    </colgroup>
  );
}

export default async function DailyMenuExportPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const menuDate = params.date || new Date().toISOString().slice(0, 10);
  const shift = params.shift || "AM";

  const entries = await getDailyMenuEntries(menuDate, shift);
  const grouped = groupByUic(entries);

  return (
    <div className="min-h-screen bg-[#e8e8ee] py-8 print:bg-white print:py-0">
      <ExportActions filename={`RepairX-DailyMenu-${menuDate}-${shift}`} />

      <div
        id="print-report"
        className="mx-auto flex w-[1200px] flex-col gap-5 bg-white p-10 text-[#0f0f10] print:w-full"
      >
        <header className="flex items-end justify-between border-b-2 border-[#0f0f10] pb-3">
          <div>
            <h1 className="text-[28px] font-bold uppercase tracking-[0.9px]">Daily Menu</h1>
            <p className="mt-1 text-sm text-[#5a5a5f]">RepairX — Repair Production Control</p>
          </div>
          <div className="text-right font-mono text-sm">
            <div>{formatDate(menuDate)}</div>
            <div className="font-bold uppercase">{shift} Shift</div>
          </div>
        </header>

        {grouped.map(([uic, groupEntries]) => (
          <table key={uic} className="w-full table-fixed border-collapse text-xs">
            <ReportColgroup />
            <thead>
              <tr className="bg-[#f0f0fa]">
                <th colSpan={10} className="border border-[#e0e0e8] px-2 py-1.5 text-left uppercase tracking-[0.5px]">
                  UIC: {uic}
                </th>
              </tr>
              <tr className="bg-[#f0f0fa] text-left uppercase tracking-[0.5px]">
                <th className="border border-[#e0e0e8] px-2 py-1.5">Order</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Description</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Serial</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Engine</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Ops</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Activity</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Manhours</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Progress</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Stamp</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Barcode status</th>
              </tr>
            </thead>
            <tbody>
              {groupEntries.map((e) => (
                <tr key={e.id}>
                  <td className="border border-[#e0e0e8] px-2 py-1.5 font-mono">{e.orderNumber}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5">{e.orderDescription}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5 font-mono">{e.orderSerialNumber ?? "-"}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5">{e.orderEngineType ?? "-"}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5 font-mono">{e.ops}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5">{e.activity}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5 font-mono">{e.planMhrs ?? 0}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5 font-mono">{e.progressPct ?? 0}%</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5 text-center">{e.stamp ? "✓" : "—"}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5">{e.completenessStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

        <footer className="mt-6 flex justify-between border-t border-[#e0e0e8] pt-4 text-xs text-[#5a5a5f]">
          <span>Prepared by: {session.user.name}</span>
          <span>Generated {new Date().toLocaleString("en-GB", { timeZone: "Asia/Jakarta" })}</span>
        </footer>
      </div>
    </div>
  );
}
