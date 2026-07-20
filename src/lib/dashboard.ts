import { and, asc, desc, eq, gt, gte, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, shiftReportEntries, dailyMenuEntries, repairPlannerEntries } from "@/db/schema";
import { getPreviousShift } from "@/lib/daily-menu";
import { summarize } from "@/lib/shift-report";
import { currentShift } from "@/lib/shift";
import { TERMINAL_UIC } from "@/lib/wc-uic-map";
import { DONE_ORDER_STATUSES } from "@/lib/order-status";

const REPEAT_WINDOW_DAYS = 10;
const STALE_WINDOW_DAYS = 7;
const THROUGHPUT_WEEKS = 8;

function todayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function daysAgoIso(days: number) {
  const d = new Date(`${todayIso()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Whole days between two day-precision ISO dates (or a timestamp, sliced down to
 * its date) — used for both order aging (dateIn -> today) and turnaround time
 * (dateIn -> completedAt). */
function daysBetweenIso(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  const end = new Date(`${endIso}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

function toIsoDate(value: string | Date): string {
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

export interface DashboardSummary {
  today: string;
  shift: "AM" | "PM" | "Overtime";
  totalOrders: number;
  /** Orders sitting in the Kitting/RPC serviceable store — finished, not active
   * work. Excluded from uicBreakdown and staleOrders since it's a terminal state,
   * not a queue (see wc-uic-map.ts: TERMINAL_UIC). */
  inServiceableStore: number;
  statusBreakdown: Array<{ label: string; count: number }>;
  uicBreakdown: Array<{ label: string; count: number }>;
  overdueOrders: Array<{ orderNumber: string; description: string | null; gate4Target: string | null; status: string | null }>;
  todayMenuCount: number;
  lastShift: { date: string; shift: string; totalEntries: number; closedCount: number };
  plannerTotal: number;
  plannerWip: number;
  repeatOrders: Array<{ orderNumber: string; menuDays: number }>;
  staleOrders: Array<{ orderNumber: string; description: string | null; uicToday: string | null }>;
  /** Average days from dateIn to completedAt across every order that has reached
   * Kitting/RPC since that column started being stamped — see schema.ts. sampleSize
   * lets the UI caveat a still-small sample rather than presenting it as settled. */
  tat: { avgDays: number | null; sampleSize: number };
  tatByEngineType: Array<{ label: string; avgDays: number; sampleSize: number }>;
  agingBuckets: Array<{ label: string; count: number }>;
  weeklyThroughput: Array<{ weekLabel: string; intake: number; completed: number }>;
}

/** Every number the Dashboard (and the AI insight prompt) is built from — one place
 * so the two stay consistent with each other. Cheap at this scale (~3k orders); run
 * as Promise.all like the rest of the app's list pages. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = todayIso();
  const shift = currentShift();
  const last = getPreviousShift(today, shift);

  const [
    totalOrdersResult,
    inStoreResult,
    statusRows,
    uicRows,
    overdueOrders,
    todayMenuCountResult,
    lastShiftEntries,
    plannerTotalResult,
    plannerClosedResult,
    repeatOrders,
    staleOrders,
    turnaround,
    weeklyThroughput,
  ] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.archived, false)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.archived, false), eq(orders.uicToday, TERMINAL_UIC))),
    db
      .select({ label: orders.status, n: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.archived, false))
      .groupBy(orders.status)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({ label: orders.uicToday, n: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.archived, false), or(isNull(orders.uicToday), ne(orders.uicToday, TERMINAL_UIC))))
      .groupBy(orders.uicToday)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({
        orderNumber: orders.orderNumber,
        description: orders.description,
        gate4Target: orders.gate4Target,
        status: orders.status,
      })
      .from(orders)
      .where(
        and(
          eq(orders.archived, false),
          // Some imported rows carry Excel's null-date sentinel (1899-12-30) instead
          // of a real blank — treat anything before 2000 as "no target set", not
          // "9000 days overdue".
          gt(orders.gate4Target, "2000-01-01"),
          lt(orders.gate4Target, today),
          or(isNull(orders.status), and(ne(orders.status, "Completed"), ne(orders.status, "Cancelled"))),
          // Already finished and sitting in the serviceable store — it got there
          // late, but it's not still "overdue" work needing a nudge onto the next
          // Daily Menu (see TERMINAL_UIC).
          or(isNull(orders.uicToday), ne(orders.uicToday, TERMINAL_UIC)),
        ),
      )
      .orderBy(asc(orders.gate4Target))
      .limit(10),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(dailyMenuEntries)
      .where(and(eq(dailyMenuEntries.menuDate, today), eq(dailyMenuEntries.shift, shift), eq(dailyMenuEntries.archived, false))),
    db
      .select()
      .from(shiftReportEntries)
      .where(
        and(
          eq(shiftReportEntries.reportDate, last.date),
          eq(shiftReportEntries.shift, last.shift),
          eq(shiftReportEntries.archived, false),
        ),
      ),
    db.select({ n: sql<number>`count(*)::int` }).from(repairPlannerEntries).where(eq(repairPlannerEntries.archived, false)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(repairPlannerEntries)
      .where(and(eq(repairPlannerEntries.archived, false), sql`lower(${repairPlannerEntries.projectStatus}) = 'closed'`)),
    db
      .select({
        orderNumber: dailyMenuEntries.orderNumber,
        menuDays: sql<number>`count(distinct ${dailyMenuEntries.menuDate})::int`,
      })
      .from(dailyMenuEntries)
      .where(and(eq(dailyMenuEntries.archived, false), gte(dailyMenuEntries.menuDate, daysAgoIso(REPEAT_WINDOW_DAYS))))
      .groupBy(dailyMenuEntries.orderNumber)
      .having(sql`count(distinct ${dailyMenuEntries.menuDate}) >= 3`)
      .orderBy(desc(sql`count(distinct ${dailyMenuEntries.menuDate})`))
      .limit(10),
    getStaleOrders(),
    getTurnaroundMetrics(today),
    getWeeklyThroughput(today),
  ]);

  const summary = summarize(lastShiftEntries);

  return {
    today,
    shift,
    totalOrders: totalOrdersResult[0]?.n ?? 0,
    inServiceableStore: inStoreResult[0]?.n ?? 0,
    statusBreakdown: statusRows.map((r) => ({ label: r.label || "Unset", count: r.n })),
    uicBreakdown: uicRows.map((r) => ({ label: r.label || "Unassigned", count: r.n })),
    overdueOrders,
    todayMenuCount: todayMenuCountResult[0]?.n ?? 0,
    lastShift: { date: last.date, shift: last.shift, totalEntries: summary.totalEntries, closedCount: summary.closedCount },
    plannerTotal: plannerTotalResult[0]?.n ?? 0,
    plannerWip: (plannerTotalResult[0]?.n ?? 0) - (plannerClosedResult[0]?.n ?? 0),
    repeatOrders,
    staleOrders,
    tat: turnaround.tat,
    tatByEngineType: turnaround.tatByEngineType,
    agingBuckets: turnaround.agingBuckets,
    weeklyThroughput,
  };
}

/** Orders with no shift-report activity in the last 7 days, excluding orders already
 * marked done or already sitting in the Kitting/RPC serviceable store — a part
 * untouched this long usually means it's blocked on something outside the
 * shift-report workflow (material, decision, tooling), but idle-in-storage is the
 * expected end state, not a problem. */
async function getStaleOrders() {
  const touchedRows = await db
    .selectDistinct({ orderNumber: shiftReportEntries.orderNumber })
    .from(shiftReportEntries)
    .where(and(eq(shiftReportEntries.archived, false), gte(shiftReportEntries.reportDate, daysAgoIso(STALE_WINDOW_DAYS))));
  const touched = new Set(touchedRows.map((r) => r.orderNumber));

  const activeOrders = await db
    .select({ orderNumber: orders.orderNumber, description: orders.description, uicToday: orders.uicToday, status: orders.status })
    .from(orders)
    .where(and(eq(orders.archived, false), or(isNull(orders.uicToday), ne(orders.uicToday, TERMINAL_UIC))))
    .limit(500);

  return activeOrders
    .filter((o) => !touched.has(o.orderNumber) && !DONE_ORDER_STATUSES.includes((o.status ?? "").toLowerCase()))
    .slice(0, 10);
}

const AGING_BUCKETS = [
  { label: "0-30d", max: 30 },
  { label: "31-90d", max: 90 },
  { label: "90d+", max: Infinity },
] as const;

/** Turnaround time (dateIn -> completedAt) and an intake-age breakdown of orders
 * still open. completedAt only started being stamped once the Kitting/RPC
 * terminal-state rule shipped (see wc-uic-map.ts), so the TAT sample naturally grows
 * over time rather than being backfilled with guessed dates — see schema.ts. */
async function getTurnaroundMetrics(today: string) {
  const [completedRows, openRows] = await Promise.all([
    db
      .select({ dateIn: orders.dateIn, completedAt: orders.completedAt, engineType: orders.engineType })
      .from(orders)
      .where(and(eq(orders.archived, false), isNotNull(orders.completedAt), isNotNull(orders.dateIn))),
    db
      .select({ dateIn: orders.dateIn })
      .from(orders)
      .where(
        and(
          eq(orders.archived, false),
          or(isNull(orders.uicToday), ne(orders.uicToday, TERMINAL_UIC)),
          or(isNull(orders.status), and(ne(orders.status, "Completed"), ne(orders.status, "Cancelled"))),
        ),
      ),
  ]);

  const tatDays = completedRows.map((r) => daysBetweenIso(r.dateIn!, toIsoDate(r.completedAt!)));
  const avgTat = tatDays.length > 0 ? Math.round(tatDays.reduce((a, b) => a + b, 0) / tatDays.length) : null;

  const byEngineType = new Map<string, number[]>();
  for (const r of completedRows) {
    const key = r.engineType || "Unknown";
    const list = byEngineType.get(key) ?? [];
    list.push(daysBetweenIso(r.dateIn!, toIsoDate(r.completedAt!)));
    byEngineType.set(key, list);
  }
  const tatByEngineType = Array.from(byEngineType.entries())
    .map(([label, days]) => ({
      label,
      avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
      sampleSize: days.length,
    }))
    .sort((a, b) => b.avgDays - a.avgDays)
    .slice(0, 8);

  const agingBuckets: Array<{ label: string; count: number }> = AGING_BUCKETS.map((b) => ({ label: b.label, count: 0 }));
  let unknownAge = 0;
  for (const r of openRows) {
    if (!r.dateIn) {
      unknownAge++;
      continue;
    }
    const age = daysBetweenIso(r.dateIn, today);
    const bucketIndex = AGING_BUCKETS.findIndex((b) => age <= b.max);
    const bucket = agingBuckets[bucketIndex === -1 ? agingBuckets.length - 1 : bucketIndex];
    if (bucket) bucket.count += 1;
  }
  if (unknownAge > 0) agingBuckets.push({ label: "Unknown intake", count: unknownAge });

  return {
    tat: { avgDays: avgTat, sampleSize: tatDays.length },
    tatByEngineType,
    agingBuckets,
  };
}

/** Rolling weekly intake (by dateIn) vs. completions (by completedAt) for the last
 * THROUGHPUT_WEEKS weeks — a coarse but cheap "is the backlog growing or shrinking"
 * signal. Bucketed in JS from a bounded window rather than SQL date_trunc, since the
 * row count in that window is always small. */
async function getWeeklyThroughput(today: string) {
  const windowStart = daysAgoIso(THROUGHPUT_WEEKS * 7);
  const windowStartDate = new Date(`${windowStart}T00:00:00Z`);

  const [intakeRows, completedRows] = await Promise.all([
    db
      .select({ dateIn: orders.dateIn })
      .from(orders)
      .where(and(eq(orders.archived, false), gte(orders.dateIn, windowStart))),
    db
      .select({ completedAt: orders.completedAt })
      .from(orders)
      .where(and(eq(orders.archived, false), gte(orders.completedAt, windowStartDate))),
  ]);

  const weeks = Array.from({ length: THROUGHPUT_WEEKS }, (_, i) => {
    const weeksAgo = THROUGHPUT_WEEKS - 1 - i;
    const start = daysAgoIso(weeksAgo * 7 + 6);
    return { weekLabel: start, intake: 0, completed: 0 };
  });

  function bucketFor(iso: string) {
    const age = daysBetweenIso(iso, today);
    const index = THROUGHPUT_WEEKS - 1 - Math.floor(age / 7);
    return weeks[index];
  }

  for (const r of intakeRows) {
    if (!r.dateIn) continue;
    const b = bucketFor(r.dateIn);
    if (b) b.intake += 1;
  }
  for (const r of completedRows) {
    if (!r.completedAt) continue;
    const b = bucketFor(toIsoDate(r.completedAt));
    if (b) b.completed += 1;
  }

  return weeks;
}
