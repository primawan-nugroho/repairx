import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getShiftReportEntries, groupByWorkCenter, summarize } from "@/lib/shift-report";
import { formatDate } from "@/lib/utils";
import { ExportActions } from "./export-actions";

interface PageProps {
  searchParams: Promise<{ date?: string; shift?: string }>;
}

export default async function ShiftReportExportPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const reportDate = params.date || new Date().toISOString().slice(0, 10);
  const shift = params.shift || "AM";

  const entries = await getShiftReportEntries(reportDate, shift);
  const grouped = groupByWorkCenter(entries);
  const summary = summarize(entries);

  return (
    <div className="min-h-screen bg-[#e8e8ee] py-8 print:bg-white print:py-0">
      <ExportActions filename={`RepairX-ShiftReport-${reportDate}-${shift}`} />

      <div
        id="print-report"
        className="mx-auto flex w-[1200px] flex-col gap-5 bg-white p-10 text-[#0f0f10] print:w-full"
      >
        <header className="flex items-end justify-between border-b-2 border-[#0f0f10] pb-3">
          <div>
            <h1 className="text-[28px] font-bold uppercase tracking-[0.9px]">
              General Repair End Shift Report
            </h1>
            <p className="mt-1 text-sm text-[#5a5a5f]">RepairX — Repair Production Control</p>
          </div>
          <div className="text-right font-mono text-sm">
            <div>{formatDate(reportDate)}</div>
            <div className="font-bold uppercase">{shift} Shift</div>
          </div>
        </header>

        {grouped.map(([workCenter, groupEntries]) => (
          <table key={workCenter} className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#f0f0fa]">
                <th colSpan={7} className="border border-[#e0e0e8] px-2 py-1.5 text-left uppercase tracking-[0.5px]">
                  Work Center: {workCenter}
                </th>
              </tr>
              <tr className="bg-[#f0f0fa] text-left uppercase tracking-[0.5px]">
                <th className="border border-[#e0e0e8] px-2 py-1.5">Order</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">UIC</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Ops</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Activity</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Progress</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Manhours</th>
                <th className="border border-[#e0e0e8] px-2 py-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {groupEntries.map((e) => (
                <tr key={e.id}>
                  <td className="border border-[#e0e0e8] px-2 py-1.5 font-mono">{e.orderNumber}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5">{e.uic}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5 font-mono">{e.ops}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5">{e.activity}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5 font-mono">{e.progressPct ?? 0}%</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5 font-mono">{e.manhours ?? 0}</td>
                  <td className="border border-[#e0e0e8] px-2 py-1.5">{e.completenessStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr className="bg-[#f0f0fa] font-bold uppercase tracking-[0.5px]">
              <td className="border border-[#e0e0e8] px-2 py-1.5">Total Entries</td>
              <td className="border border-[#e0e0e8] px-2 py-1.5 font-mono">{summary.totalEntries}</td>
              <td className="border border-[#e0e0e8] px-2 py-1.5">Closed</td>
              <td className="border border-[#e0e0e8] px-2 py-1.5 font-mono">{summary.closedCount}</td>
              <td className="border border-[#e0e0e8] px-2 py-1.5">Total Manhours</td>
              <td className="border border-[#e0e0e8] px-2 py-1.5 font-mono">{summary.totalManhours}</td>
            </tr>
          </tbody>
        </table>

        <footer className="mt-6 flex justify-between border-t border-[#e0e0e8] pt-4 text-xs text-[#5a5a5f]">
          <span>Prepared by: {session.user.name}</span>
          <span>Generated {new Date().toLocaleString("en-GB", { timeZone: "Asia/Jakarta" })}</span>
        </footer>
      </div>
    </div>
  );
}
