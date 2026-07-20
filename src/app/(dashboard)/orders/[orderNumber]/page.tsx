import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByNumber, getShiftReportHistory, getDailyMenuHistory } from "@/lib/order-history";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { UicBadge, WorkCenterBadge } from "@/components/uic-badge";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

function daysBetween(start: string | Date, end: string | Date): number {
  const startMs = new Date(typeof start === "string" ? `${start}T00:00:00Z` : start).getTime();
  const endMs = new Date(typeof end === "string" ? `${end}T00:00:00Z` : end).getTime();
  return Math.max(0, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderNumber: rawOrderNumber } = await params;
  const orderNumber = decodeURIComponent(rawOrderNumber);

  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  const [shiftHistory, menuHistory] = await Promise.all([
    getShiftReportHistory(orderNumber),
    getDailyMenuHistory(orderNumber),
  ]);

  const tatDays = order.dateIn && order.completedAt ? daysBetween(order.dateIn, order.completedAt) : null;
  const ageDays = order.dateIn ? daysBetween(order.dateIn, new Date()) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/orders" className="text-xs font-medium text-text-secondary hover:text-text-primary">
          ← Back to Orders
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="data-mono text-2xl font-semibold text-text-primary">{order.orderNumber}</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-sm text-text-secondary">{order.description || "-"}</p>
      </div>

      <div className="bg-surface-solid grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border p-5 text-sm md:grid-cols-4">
        <InfoField label="Date in" value={formatDate(order.dateIn)} />
        <InfoField label="Gate 4 target" value={formatDate(order.gate4Target)} />
        <InfoField label="Plan finish date" value={formatDate(order.planFinishDate)} />
        <InfoField
          label={order.completedAt ? "Completed (in store)" : "Age"}
          value={
            order.completedAt
              ? `${formatDate(order.completedAt)}${tatDays !== null ? ` · ${tatDays}d TAT` : ""}`
              : ageDays !== null
                ? `${ageDays}d since intake`
                : "-"
          }
        />
        <InfoField label="Serial number" value={order.serialNumber || "-"} mono />
        <InfoField label="Engine type" value={order.engineType || "-"} />
        <InfoField label="Work center" value={<WorkCenterBadge workCenter={order.mwcToday} />} />
        <InfoField label="UIC" value={<UicBadge uic={order.uicToday} />} />
        <InfoField label="MWC routing" value={order.mwcRouting || "-"} mono />
        <InfoField label="Location" value={order.location || "-"} />
        <div className="col-span-2 md:col-span-4">
          <InfoField label="Remark" value={order.remark || "-"} />
        </div>
      </div>

      <HistorySection title={`Shift report history (${shiftHistory.length})`} emptyMessage="No shift-report entries logged for this order yet.">
        {shiftHistory.length > 0 && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-text-secondary">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Shift</th>
                <th className="px-3 py-2">Work center</th>
                <th className="px-3 py-2">UIC</th>
                <th className="px-3 py-2">Ops</th>
                <th className="px-3 py-2">Activity</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {shiftHistory.map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="data-mono whitespace-nowrap px-3 py-2">{formatDate(entry.reportDate)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{entry.shift}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <WorkCenterBadge workCenter={entry.workCenter} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <UicBadge uic={entry.uic} />
                  </td>
                  <td className="data-mono whitespace-nowrap px-3 py-2">{entry.ops || "-"}</td>
                  <td className="max-w-[320px] px-3 py-2">
                    <span className="line-clamp-2">{entry.activity || "-"}</span>
                  </td>
                  <td className="data-mono whitespace-nowrap px-3 py-2">{entry.progressPct ?? "-"}%</td>
                  <td className="whitespace-nowrap px-3 py-2">{entry.completenessStatus || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </HistorySection>

      <HistorySection title={`Daily menu appearances (${menuHistory.length})`} emptyMessage="This order has never been planned on a Daily Menu.">
        {menuHistory.length > 0 && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-text-secondary">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Shift</th>
                <th className="px-3 py-2">Work center</th>
                <th className="px-3 py-2">UIC</th>
                <th className="px-3 py-2">Ops</th>
                <th className="px-3 py-2">Activity</th>
              </tr>
            </thead>
            <tbody>
              {menuHistory.map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="data-mono whitespace-nowrap px-3 py-2">{formatDate(entry.menuDate)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{entry.shift}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <WorkCenterBadge workCenter={entry.workCenter} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <UicBadge uic={entry.uic} />
                  </td>
                  <td className="data-mono whitespace-nowrap px-3 py-2">{entry.ops || "-"}</td>
                  <td className="max-w-[320px] px-3 py-2">
                    <span className="line-clamp-2">{entry.activity || "-"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </HistorySection>
    </div>
  );
}

function InfoField({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <span className={mono ? "data-mono text-text-primary" : "text-text-primary"}>{value}</span>
    </div>
  );
}

function HistorySection({
  title,
  emptyMessage,
  children,
}: {
  title: string;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  const isEmpty = !children;
  return (
    <div className="bg-surface-solid flex flex-col gap-3 rounded-lg border border-border p-5">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <div className="overflow-x-auto">{children}</div>
      {isEmpty && <p className="text-xs text-text-tertiary">{emptyMessage}</p>}
    </div>
  );
}
