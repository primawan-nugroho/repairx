import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, shiftReportEntries, dailyMenuEntries } from "@/db/schema";

export async function getOrderByNumber(orderNumber: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  return order ?? null;
}

/** Every shift-report entry ever logged against this order, newest first — the full
 * work trail a supervisor would want when asked "what happened with this part?". */
export async function getShiftReportHistory(orderNumber: string) {
  return db
    .select()
    .from(shiftReportEntries)
    .where(and(eq(shiftReportEntries.orderNumber, orderNumber), eq(shiftReportEntries.archived, false)))
    .orderBy(desc(shiftReportEntries.reportDate), desc(shiftReportEntries.id));
}

/** Every Daily Menu appearance for this order, newest first — shows how many shifts
 * it was planned for versus how many it was actually reported on (see
 * getShiftReportHistory), which is how the Dashboard's "repeat carry-over" signal is
 * derived (see dashboard.ts) — this page is where that number can be inspected. */
export async function getDailyMenuHistory(orderNumber: string) {
  return db
    .select()
    .from(dailyMenuEntries)
    .where(and(eq(dailyMenuEntries.orderNumber, orderNumber), eq(dailyMenuEntries.archived, false)))
    .orderBy(desc(dailyMenuEntries.menuDate), desc(dailyMenuEntries.id));
}
