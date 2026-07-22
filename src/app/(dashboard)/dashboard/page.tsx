import Link from "next/link";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardSummary } from "@/lib/dashboard";
import { getCachedInsight } from "@/lib/ai-insight";
import { getMasters } from "@/lib/masters";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { greeting } from "@/lib/shift";
import { StatusDonutChart, UicDonutChart, MetricBarChart, ThroughputBarChart } from "./dashboard-charts";
import { AiInsightCard } from "./ai-insight-card";

export default async function DashboardPage() {
  const [summary, masters, session] = await Promise.all([getDashboardSummary(), getMasters(), auth()]);
  const cachedInsight = await getCachedInsight(summary.today, summary.shift);
  const firstName = session?.user.name?.split(" ")[0] ?? session?.user.username ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          {greeting()}, {firstName}
        </h1>
        <p className="text-sm text-text-secondary">
          {formatDate(summary.today)} · {summary.shift} shift
        </p>
      </div>

      <h2 className="border-b border-border pb-2 text-sm font-semibold text-text-primary">Overview</h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <KpiTile
          label="Open orders"
          value={summary.totalOrders}
          href="/orders"
          trend={{ delta: summary.backlogTrend.delta, goodDirection: "down" }}
        />
        <KpiTile
          label="In serviceable store"
          value={summary.inServiceableStore}
          sub="finished, awaiting pickup"
          href={masters.terminalUic ? `/orders?uic=${encodeURIComponent(masters.terminalUic)}` : "/orders"}
        />
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
        <Card>
          <CardContent>
            <h2 className="text-sm font-semibold text-text-primary">Orders by status</h2>
            <StatusDonutChart rows={summary.statusBreakdown} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-sm font-semibold text-text-primary">Active workload by UIC</h2>
            {masters.terminalUic && (
              <p className="-mt-2 text-xs text-text-tertiary">Excludes {masters.terminalUic} (serviceable store)</p>
            )}
            <UicDonutChart rows={summary.uicBreakdown} uicColorSlugs={masters.uicColorSlugs} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent>
            <h2 className="text-sm font-semibold text-text-primary">Average turnaround time</h2>
            <p className="text-xs text-text-tertiary">Date in → serviceable store, since this metric started tracking</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="data-mono text-3xl font-semibold text-text-primary">
                {summary.tat.avgDays ?? "-"}
              </span>
              <span className="text-sm text-text-secondary">days</span>
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              {summary.tat.sampleSize === 0
                ? "No orders have reached the store since tracking started."
                : `Based on ${summary.tat.sampleSize} completed order${summary.tat.sampleSize === 1 ? "" : "s"}.`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-sm font-semibold text-text-primary">Open order age</h2>
            <MetricBarChart rows={summary.agingBuckets.map((b) => ({ label: b.label, value: b.count }))} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-sm font-semibold text-text-primary">Weekly intake vs. completed</h2>
            <ThroughputBarChart weeks={summary.weeklyThroughput} />
          </CardContent>
        </Card>
      </div>

      {summary.tatByEngineType.length > 0 && (
        <Card>
          <CardContent>
            <h2 className="text-sm font-semibold text-text-primary">Turnaround time by engine type</h2>
            <MetricBarChart
              rows={summary.tatByEngineType.map((t) => ({ label: t.label, value: t.avgDays, sublabel: `(n=${t.sampleSize})` }))}
              unit="d"
            />
          </CardContent>
        </Card>
      )}

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

function KpiTile({
  label,
  value,
  sub,
  href,
  trend,
}: {
  label: string;
  value: number;
  sub?: string;
  href: string;
  /** goodDirection: which sign of delta counts as improving — "down" for a metric
   * like backlog where shrinking is good, "up" for one where growing is good. */
  trend?: { delta: number; goodDirection: "up" | "down" };
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-1 border-t border-border pt-3 transition-opacity hover:opacity-80"
    >
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <span className="data-mono text-2xl font-semibold text-text-primary">{value}</span>
      {sub && <span className="text-xs text-text-tertiary">{sub}</span>}
      {trend && <TrendBadge {...trend} />}
    </Link>
  );
}

function TrendBadge({ delta, goodDirection }: { delta: number; goodDirection: "up" | "down" }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-text-tertiary">
        <Minus className="size-3" />
        No change this week
      </span>
    );
  }
  const improving = goodDirection === "down" ? delta < 0 : delta > 0;
  const Icon = delta > 0 ? ArrowUp : ArrowDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        improving ? "text-status-closed" : "text-status-urgent"
      }`}
    >
      <Icon className="size-3" />
      {Math.abs(delta)} this week
    </span>
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
    <Card>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
