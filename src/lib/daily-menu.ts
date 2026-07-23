import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyMenuEntries, orders, shiftReportEntries, type DailyMenuEntry } from "@/db/schema";

export type DailyMenuRow = DailyMenuEntry & {
  orderDescription: string | null;
  orderSerialNumber: string | null;
  orderEngineType: string | null;
};

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
      orderSerialNumber: orders.serialNumber,
      orderEngineType: orders.engineType,
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

  return rows.map((r) => ({
    ...r.entry,
    orderDescription: r.orderDescription,
    orderSerialNumber: r.orderSerialNumber,
    orderEngineType: r.orderEngineType,
  }));
}

/** Copies unfinished entries (barcode status not Closed/Final Confirm) from a chosen
 * source shift's end-shift report into the daily menu for the given date/shift —
 * completed work doesn't need to be re-deployed, so it's left out rather than
 * copied and then manually deleted every morning. No-op if the menu already has
 * entries, so re-clicking "populate" doesn't duplicate rows. The source shift is
 * picked by the user (see PopulateButton) rather than assumed to be the immediately
 * preceding shift — sometimes that shift had nothing useful and an earlier one did. */
export async function populateDailyMenuFromShift(
  menuDate: string,
  shift: string,
  sourceDate: string,
  sourceShift: string,
  createdBy: number,
): Promise<number> {
  const existing = await db
    .select({ id: dailyMenuEntries.id })
    .from(dailyMenuEntries)
    .where(and(eq(dailyMenuEntries.menuDate, menuDate), eq(dailyMenuEntries.shift, shift as Shift), eq(dailyMenuEntries.archived, false)))
    .limit(1);
  if (existing.length > 0) return 0;

  const allSourceEntries = await db
    .select()
    .from(shiftReportEntries)
    .where(
      and(
        eq(shiftReportEntries.reportDate, sourceDate),
        eq(shiftReportEntries.shift, sourceShift as Shift),
        eq(shiftReportEntries.archived, false),
      ),
    );

  const sourceEntries = allSourceEntries.filter((e) => {
    const s = e.completenessStatus?.toLowerCase();
    return s !== "closed" && s !== "final confirm";
  });

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
      progressPct: e.progressPct,
      stamp: e.stamp,
      completenessStatus: e.completenessStatus,
      remark: e.remark,
      createdBy,
    })),
  );

  return sourceEntries.length;
}
