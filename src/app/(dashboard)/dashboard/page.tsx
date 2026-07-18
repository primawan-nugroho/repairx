import Link from "next/link";
import { getDashboardSummary } from "@/lib/dashboard";
import { getCachedInsight } from "@/lib/ai-insight";
import { formatDate } from "@/lib/utils";
import { StatusBarChart, UicBarChart } from "./dashboard-charts";
import { AiInsightCard } from "./ai-insight-card";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();
  const cachedInsight = await getCachedInsight(summary.today, summary.shift);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">
          {formatDate(summary.today)} · {summary.shift} shift
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiTile label="Open orders" value={summary.totalOrders} href="/orders" />
        <KpiTile label="Today's menu entries" value={summary.todayMenuCount} href="/daily-menu" />
        <KpiTile
          label={`Last shift (${summary.lastShift.shift})`}
          value={summary.lastShift.totalEntries}
          sub={`${summary.lastShift.closedCount} final confirmed`}
          href="/shift-report"
        />
        <KpiTile
          label="Repair planner WIP"
          value={summary.plannerWip}
          sub={`of ${summary.plannerTotal} total`}
          href="/repair-planner"
        />
      </div>

      <AiInsightCard initialContent={cachedInsight?.content ?? null} generatedAt={cachedInsight?.createdAt ?? null} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-surface-solid flex flex-col gap-3 rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary">Orders by status</h2>
          <StatusBarChart rows={summary.statusBreakdown} />
        </div>
        <div className="bg-surface-solid flex flex-col gap-3 rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary">Orders by UIC</h2>
          <UicBarChart rows={summary.uicBreakdown} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AttentionList
          title="Past Gate 4 target"
          emptyMessage="No overdue orders."
          items={summary.overdueOrders.map((o) => ({
            key: o.orderNumber,
            primary: o.orderNumber,
            secondary: `Target ${formatDate(o.gate4Target)} · ${o.status ?? "unset"}`,
          }))}
        />
        <AttentionList
          title="Repeated on 3+ daily menus"
          emptyMessage="No repeat carry-overs in the last 10 days."
          items={summary.repeatOrders.map((o) => ({
            key: o.orderNumber,
            primary: o.orderNumber,
            secondary: `${o.menuDays} menus in 10 days`,
          }))}
        />
        <AttentionList
          title="No shift activity in 7+ days"
          emptyMessage="Every open order has recent shift activity."
          items={summary.staleOrders.map((o) => ({
            key: o.orderNumber,
            primary: o.orderNumber,
            secondary: o.uicToday ?? "Unassigned",
          }))}
        />
      </div>
    </div>
  );
}

function KpiTile({ label, value, sub, href }: { label: string; value: number; sub?: string; href: string }) {
  return (
    <Link
      href={href}
      className="bg-surface-solid flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-border-strong"
    >
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <span className="data-mono text-2xl font-semibold text-text-primary">{value}</span>
      {sub && <span className="text-xs text-text-tertiary">{sub}</span>}
    </Link>
  );
}

function AttentionList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: Array<{ key: string; primary: string; secondary: string }>;
  emptyMessage: string;
}) {
  return (
    <div className="bg-surface-solid flex flex-col gap-3 rounded-lg border border-border p-5">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      {items.length === 0 ? (
        <p className="text-xs text-text-tertiary">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.key} className="flex items-center justify-between text-xs">
              <span className="data-mono text-text-primary">{item.primary}</span>
              <span className="text-text-tertiary">{item.secondary}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
