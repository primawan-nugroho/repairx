import Link from "next/link";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { getDashboardSummary } from "@/lib/dashboard";
import { getCachedInsight } from "@/lib/ai-insight";
import { getMasters } from "@/lib/masters";
import { formatDate } from "@/lib/utils";
import { StatusDonutChart, UicDonutChart, MetricBarChart, ThroughputBarChart } from "./dashboard-charts";
import { AiInsightCard } from "./ai-insight-card";

export default async function DashboardPage() {
  const [summary, masters] = await Promise.all([getDashboardSummary(), getMasters()]);
  const cachedInsight = await getCachedInsight(summary.today, summary.shift);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">
          {formatDate(summary.today)} · {summary.shift} shift
        </p>
      </div>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 12 / 5 }}>
          <KpiTile label="Open orders" value={summary.totalOrders} href="/orders" />
        </Grid>
        <Grid size={{ xs: 6, md: 12 / 5 }}>
          <KpiTile
            label="In serviceable store"
            value={summary.inServiceableStore}
            sub="finished, awaiting pickup"
            href={masters.terminalUic ? `/orders?uic=${encodeURIComponent(masters.terminalUic)}` : "/orders"}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 12 / 5 }}>
          <KpiTile label="Today's menu entries" value={summary.todayMenuCount} href="/daily-menu" />
        </Grid>
        <Grid size={{ xs: 6, md: 12 / 5 }}>
          <KpiTile
            label={`Last shift (${summary.lastShift.shift})`}
            value={summary.lastShift.totalEntries}
            sub={`${summary.lastShift.closedCount} final confirmed`}
            href="/shift-report"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 12 / 5 }}>
          <KpiTile
            label="Repair planner WIP"
            value={summary.plannerWip}
            sub={`of ${summary.plannerTotal} total`}
            href="/repair-planner"
          />
        </Grid>
      </Grid>

      <AiInsightCard initialContent={cachedInsight?.content ?? null} generatedAt={cachedInsight?.createdAt ?? null} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" component="h2" color="text.primary" sx={{ fontWeight: 600 }}>
                Orders by status
              </Typography>
              <StatusDonutChart rows={summary.statusBreakdown} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" component="h2" color="text.primary" sx={{ fontWeight: 600 }}>
                Active workload by UIC
              </Typography>
              {masters.terminalUic && (
                <Typography variant="caption" color="text.secondary" component="p">
                  Excludes {masters.terminalUic} (serviceable store)
                </Typography>
              )}
              <UicDonutChart rows={summary.uicBreakdown} uicColorSlugs={masters.uicColorSlugs} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" component="h2" color="text.primary" sx={{ fontWeight: 600 }}>
                Average turnaround time
              </Typography>
              <Typography variant="caption" color="text.secondary" component="p">
                Date in → serviceable store, since this metric started tracking
              </Typography>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="data-mono text-3xl font-semibold text-text-primary">
                  {summary.tat.avgDays ?? "-"}
                </span>
                <Typography variant="body2" color="text.secondary">
                  days
                </Typography>
              </div>
              <Typography variant="caption" color="text.disabled" component="p" sx={{ mt: 0.5 }}>
                {summary.tat.sampleSize === 0
                  ? "No orders have reached the store since tracking started."
                  : `Based on ${summary.tat.sampleSize} completed order${summary.tat.sampleSize === 1 ? "" : "s"}.`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" component="h2" color="text.primary" sx={{ fontWeight: 600 }}>
                Open order age
              </Typography>
              <MetricBarChart rows={summary.agingBuckets.map((b) => ({ label: b.label, value: b.count }))} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" component="h2" color="text.primary" sx={{ fontWeight: 600 }}>
                Weekly intake vs. completed
              </Typography>
              <ThroughputBarChart weeks={summary.weeklyThroughput} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {summary.tatByEngineType.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" component="h2" color="text.primary" sx={{ fontWeight: 600 }}>
              Turnaround time by engine type
            </Typography>
            <MetricBarChart
              rows={summary.tatByEngineType.map((t) => ({ label: t.label, value: t.avgDays, sublabel: `(n=${t.sampleSize})` }))}
              unit="d"
            />
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <AttentionList
            title="Past Gate 4 target"
            emptyMessage="No overdue orders."
            items={summary.overdueOrders.map((o) => ({
              key: o.orderNumber,
              primary: o.orderNumber,
              secondary: `Target ${formatDate(o.gate4Target)} · ${o.status ?? "unset"}`,
            }))}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <AttentionList
            title="Repeated on 3+ daily menus"
            emptyMessage="No repeat carry-overs in the last 10 days."
            items={summary.repeatOrders.map((o) => ({
              key: o.orderNumber,
              primary: o.orderNumber,
              secondary: `${o.menuDays} menus in 10 days`,
            }))}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <AttentionList
            title="No shift activity in 7+ days"
            emptyMessage="Every open order has recent shift activity."
            items={summary.staleOrders.map((o) => ({
              key: o.orderNumber,
              primary: o.orderNumber,
              secondary: o.uicToday ?? "Unassigned",
            }))}
          />
        </Grid>
      </Grid>
    </div>
  );
}

function KpiTile({ label, value, sub, href }: { label: string; value: number; sub?: string; href: string }) {
  return (
    <Card
      component={Link}
      href={href}
      sx={{
        display: "block",
        height: "100%",
        textDecoration: "none",
        transition: "border-color 0.15s",
        "&:hover": { borderColor: "var(--border-strong)" },
      }}
    >
      <CardContent>
        <Typography variant="caption" component="p" color="text.secondary" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        <span className="data-mono text-2xl font-semibold text-text-primary">{value}</span>
        {sub && (
          <Typography variant="caption" color="text.disabled" component="p">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
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
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle2" component="h2" color="text.primary" sx={{ mb: 1.5, fontWeight: 600 }}>
          {title}
        </Typography>
        {items.length === 0 ? (
          <Typography variant="caption" color="text.disabled">
            {emptyMessage}
          </Typography>
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
