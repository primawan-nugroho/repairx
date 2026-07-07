import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyMenuEntries, orders, shiftReportEntries, type DailyMenuEntry } from "@/db/schema";

export type DailyMenuRow = DailyMenuEntry & { orderDescription: string | null };

const SHIFT_ORDER = ["AM", "PM", "Overtime"] as const;
type Shift = (typeof SHIFT_ORDER)[number];

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The Daily Menu is seeded from the shift immediately before it — Overtime rolls
 * back to the previous day's PM... wait, actually the shift sequence within a day is
 * AM -> PM -> Overtime, so the shift before a given AM is the prior day's Overtime. */
export function getPreviousShift(date: string, shift: string): { date: string; shift: Shift } {
  const index = SHIFT_ORDER.indexOf(shift as Shift);
  if (index <= 0) {
    return { date: addDays(date, -1), shift: "Overtime" };
  }
  return { date, shift: SHIFT_ORDER[index - 1]! };
}

export async function getDailyMenuEntries(menuDate: string, shift: string): Promise<DailyMenuRow[]> {
  const rows = await db
    .select({
      entry: dailyMenuEntries,
      orderDescription: orders.description,
    })
    .from(dailyMenuEntries)
    .leftJoin(orders, eq(orders.orderNumber, dailyMenuEntries.orderNumber))
    .where(
      and(
        eq(dailyMenuEntries.menuDate, menuDate),
        eq(dailyMenuEntries.shift, shift as Shift),
        eq(dailyMenuEntries.archived, false),
      ),
    )
    .orderBy(asc(dailyMenuEntries.uic), asc(dailyMenuEntries.workCenter));

  return rows.map((r) => ({ ...r.entry, orderDescription: r.orderDescription }));
}

/** Copies every entry (closed included) from the previous shift's end-shift report
 * into the daily menu for the given date/shift — production control trims what's
 * already done. No-op if the menu already has entries, so re-clicking "populate"
 * doesn't duplicate rows. */
export async function populateDailyMenuFromPreviousShift(
  menuDate: string,
  shift: string,
  createdBy: number,
): Promise<number> {
  const existing = await db
    .select({ id: dailyMenuEntries.id })
    .from(dailyMenuEntries)
    .where(and(eq(dailyMenuEntries.menuDate, menuDate), eq(dailyMenuEntries.shift, shift as Shift)))
    .limit(1);
  if (existing.length > 0) return 0;

  const prev = getPreviousShift(menuDate, shift);
  const sourceEntries = await db
    .select()
    .from(shiftReportEntries)
    .where(
      and(
        eq(shiftReportEntries.reportDate, prev.date),
        eq(shiftReportEntries.shift, prev.shift),
        eq(shiftReportEntries.archived, false),
      ),
    );

  if (sourceEntries.length === 0) return 0;

  await db.insert(dailyMenuEntries).values(
    sourceEntries.map((e) => ({
      menuDate,
      shift: shift as Shift,
      orderNumber: e.orderNumber,
      workCenter: e.workCenter,
      uic: e.uic,
      ops: e.ops,
      activity: e.activity,
      planMhrs: e.planMhrs,
      consumedMhrs: e.consumedMhrs,
      manhours: e.manhours,
      progressPct: e.progressPct,
      stampPct: e.stampPct,
      completenessStatus: e.completenessStatus,
      remark: e.remark,
      createdBy,
    })),
  );

  return sourceEntries.length;
}
