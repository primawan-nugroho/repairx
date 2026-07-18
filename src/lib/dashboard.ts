import { and, asc, desc, eq, gt, gte, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, shiftReportEntries, dailyMenuEntries, repairPlannerEntries } from "@/db/schema";
import { getPreviousShift } from "@/lib/daily-menu";
import { summarize } from "@/lib/shift-report";
import { currentShift } from "@/lib/shift";

const DONE_STATUSES = ["completed", "cancelled"];
const REPEAT_WINDOW_DAYS = 10;
const STALE_WINDOW_DAYS = 7;

function todayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function daysAgoIso(days: number) {
  const d = new Date(`${todayIso()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export interface DashboardSummary {
  today: string;
  shift: "AM" | "PM" | "Overtime";
  totalOrders: number;
  statusBreakdown: Array<{ label: string; count: number }>;
  uicBreakdown: Array<{ label: string; count: number }>;
  overdueOrders: Array<{ orderNumber: string; description: string | null; gate4Target: string | null; status: string | null }>;
  todayMenuCount: number;
  lastShift: { date: string; shift: string; totalEntries: number; closedCount: number };
  plannerTotal: number;
  plannerWip: number;
  repeatOrders: Array<{ orderNumber: string; menuDays: number }>;
  staleOrders: Array<{ orderNumber: string; description: string | null; uicToday: string | null }>;
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
    statusRows,
    uicRows,
    overdueOrders,
    todayMenuCountResult,
    lastShiftEntries,
    plannerTotalResult,
    plannerClosedResult,
    repeatOrders,
    staleOrders,
  ] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.archived, false)),
    db
      .select({ label: orders.status, n: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.archived, false))
      .groupBy(orders.status)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({ label: orders.uicToday, n: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.archived, false))
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
  ]);

  const summary = summarize(lastShiftEntries);

  return {
    today,
    shift,
    totalOrders: totalOrdersResult[0]?.n ?? 0,
    statusBreakdown: statusRows.map((r) => ({ label: r.label || "Unset", count: r.n })),
    uicBreakdown: uicRows.map((r) => ({ label: r.label || "Unassigned", count: r.n })),
    overdueOrders,
    todayMenuCount: todayMenuCountResult[0]?.n ?? 0,
    lastShift: { date: last.date, shift: last.shift, totalEntries: summary.totalEntries, closedCount: summary.closedCount },
    plannerTotal: plannerTotalResult[0]?.n ?? 0,
    plannerWip: (plannerTotalResult[0]?.n ?? 0) - (plannerClosedResult[0]?.n ?? 0),
    repeatOrders,
    staleOrders,
  };
}

/** Orders with no shift-report activity in the last 7 days, excluding orders already
 * marked done — a part sitting untouched this long usually means it's blocked on
 * something outside the shift-report workflow (material, decision, tooling). */
async function getStaleOrders() {
  const touchedRows = await db
    .selectDistinct({ orderNumber: shiftReportEntries.orderNumber })
    .from(shiftReportEntries)
    .where(and(eq(shiftReportEntries.archived, false), gte(shiftReportEntries.reportDate, daysAgoIso(STALE_WINDOW_DAYS))));
  const touched = new Set(touchedRows.map((r) => r.orderNumber));

  const activeOrders = await db
    .select({ orderNumber: orders.orderNumber, description: orders.description, uicToday: orders.uicToday, status: orders.status })
    .from(orders)
    .where(eq(orders.archived, false))
    .limit(500);

  return activeOrders
    .filter((o) => !touched.has(o.orderNumber) && !DONE_STATUSES.includes((o.status ?? "").toLowerCase()))
    .slice(0, 10);
}
