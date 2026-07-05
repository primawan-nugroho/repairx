import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, shiftReportEntries, type ShiftReportEntry } from "@/db/schema";

export async function getShiftReportEntries(reportDate: string, shift: string) {
  return db
    .select()
    .from(shiftReportEntries)
    .where(
      and(
        eq(shiftReportEntries.reportDate, reportDate),
        eq(shiftReportEntries.shift, shift as "AM" | "PM" | "Overtime"),
        eq(shiftReportEntries.archived, false),
      ),
    )
    .orderBy(asc(shiftReportEntries.workCenter), asc(shiftReportEntries.uic));
}

export function groupByWorkCenter(entries: ShiftReportEntry[]) {
  const groups = new Map<string, ShiftReportEntry[]>();
  for (const entry of entries) {
    const key = entry.workCenter || "Unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function summarize(entries: ShiftReportEntry[]) {
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
