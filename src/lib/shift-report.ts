import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, shiftReportEntries, type ShiftReportEntry } from "@/db/schema";

export type ShiftReportRow = ShiftReportEntry & { orderDescription: string | null };

export async function getShiftReportEntries(reportDate: string, shift: string): Promise<ShiftReportRow[]> {
  const rows = await db
    .select({
      entry: shiftReportEntries,
      orderDescription: orders.description,
    })
    .from(shiftReportEntries)
    .leftJoin(orders, eq(orders.orderNumber, shiftReportEntries.orderNumber))
    .where(
      and(
        eq(shiftReportEntries.reportDate, reportDate),
        eq(shiftReportEntries.shift, shift as "AM" | "PM" | "Overtime"),
        eq(shiftReportEntries.archived, false),
      ),
    )
    .orderBy(asc(shiftReportEntries.uic), asc(shiftReportEntries.workCenter));

  return rows.map((r) => ({ ...r.entry, orderDescription: r.orderDescription }));
}

/** Groups shift-like entries by UIC (unit in charge) rather than work center, since
 * UIC is what a shift-handover audience actually cares about — see CLAUDE.md domain
 * model. Shared shape between the end-shift report and the daily menu. */
export function groupByUic<T extends { uic: string | null }>(entries: T[]): Array<[string, T[]]> {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    const key = entry.uic || "Unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function summarize(entries: Array<{ manhours: string | null; completenessStatus: string | null }>) {
  const totalManhours = entries.reduce((sum, e) => sum + Number(e.manhours ?? 0), 0);
  const closedCount = entries.filter(
    (e) => e.completenessStatus?.toLowerCase() === "closed" || e.completenessStatus === "Final confirm",
  ).length;
  return {
    totalEntries: entries.length,
    closedCount,
    totalManhours,
  };
}

export async function lookupOrder(orderNumber: string) {
  const [order] = await db
    .select({
      description: orders.description,
      serialNumber: orders.serialNumber,
      engineType: orders.engineType,
      uicToday: orders.uicToday,
      mwcToday: orders.mwcToday,
    })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  return order ?? null;
}
