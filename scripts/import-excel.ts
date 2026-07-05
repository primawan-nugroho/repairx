import path from "node:path";
import { config } from "dotenv";
import * as XLSX from "xlsx";
import { forceIpv4 } from "@/lib/force-ipv4";
import { deriveUic } from "@/lib/wc-uic-map";
import { db } from "@/db";
import { orders, shiftReportEntries } from "@/db/schema";

forceIpv4();
config({ path: path.resolve(__dirname, "..", ".env.local") });

const ROOT = path.resolve(__dirname, "..");

// Excel's 1900 date system: serial 25569 = 1970-01-01 UTC. Converting through this
// formula (pure arithmetic, no local-timezone-dependent Date construction) avoids the
// off-by-one-day bug that `cellDates`/`new Date(y, m, d)` introduces whenever the
// machine's timezone is ahead of UTC.
function excelSerialToIso(serial: number): string | null {
  if (!Number.isFinite(serial)) return null;
  const utcMs = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(utcMs).toISOString().slice(0, 10);
}

function toIsoDate(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "number") return excelSerialToIso(value);
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
      .toISOString()
      .slice(0, 10);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "-") return null;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function toNullableString(value: unknown): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  return str === "" || str === "-" ? null : str;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

// Header cells in the source workbook use inconsistent whitespace (some wrap with
// \r\n, some have double spaces) — normalize both sides before matching instead of
// relying on exact-string fallbacks, which silently miss variants and import as null.
function normalizeKey(key: string): string {
  return key.replace(/\s+/g, " ").trim().toUpperCase();
}

function getField(row: Record<string, unknown>, name: string): unknown {
  const target = normalizeKey(name);
  for (const key of Object.keys(row)) {
    if (normalizeKey(key) === target) return row[key];
  }
  return undefined;
}

async function importMainDatabase() {
  const wb = XLSX.readFile(path.join(ROOT, "Main Database.xlsx"));
  const sheet = wb.Sheets[wb.SheetNames[0]!]!;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  let imported = 0;
  for (const row of rows) {
    const orderNumber = toNullableString(getField(row, "Order"));
    if (!orderNumber) continue;

    const rawPlanFinish = getField(row, "Plan Finish Date");
    const waitingRepair = String(rawPlanFinish ?? "").trim().toUpperCase() === "WR";
    const tierNum = toNullableNumber(getField(row, "TIER"));
    const tier = tierNum && [1, 2, 3].includes(tierNum) ? tierNum : null;

    const mwcToday = toNullableString(getField(row, "MWC Process Today"));
    const sheetUic = toNullableString(getField(row, "UIC TODAY"));
    // UIC is derived from the work center per the mapping rule (see wc-uic-map.ts).
    // Only fall back to the spreadsheet's own UIC value when the work center isn't
    // in the mapping — never let stale/free-typed UIC data override a known mapping.
    const uicToday = deriveUic(mwcToday) ?? sheetUic;

    const values = {
      orderNumber,
      dateIn: toIsoDate(getField(row, "Date IN")),
      gate4Target: toIsoDate(getField(row, "Gate 4 Target")),
      description: toNullableString(getField(row, "Description & Quantity")),
      serialNumber: toNullableString(getField(row, "Serial Number")),
      engineType: toNullableString(getField(row, "Engine Type")),
      mwcRouting: toNullableString(getField(row, "MWC Process Tracking")),
      mwcToday,
      uicToday,
      planFinishDate: waitingRepair ? null : toIsoDate(rawPlanFinish),
      waitingRepair,
      tier,
      status: toNullableString(getField(row, "STATUS")),
      remark: toNullableString(getField(row, "REMARK")),
      location: toNullableString(getField(row, "LOCATION")),
    };

    await db
      .insert(orders)
      .values(values)
      .onConflictDoUpdate({
        target: orders.orderNumber,
        set: { ...values, updatedAt: new Date() },
      });
    imported++;
  }
  console.log(`Main Database: imported/updated ${imported} orders`);
}

async function importShiftReport() {
  const wb = XLSX.readFile(path.join(ROOT, "End Shift Report.xlsx"));
  const sheet = wb.Sheets[wb.SheetNames[0]!]!;
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });

  let currentDate: string | null = null;
  let currentShift: string | null = null;
  let imported = 0;

  // Data begins after the merged title/header rows; detect by first row with a
  // numeric-looking Order Number in column 2.
  const dataRows = raw.filter((r) => {
    const orderNumber = r[2];
    return orderNumber != null && /^\d{6,}$/.test(String(orderNumber).trim());
  });

  for (const row of raw) {
    const orderNumberRaw = row[2];
    const looksLikeData = orderNumberRaw != null && /^\d{6,}$/.test(String(orderNumberRaw).trim());
    if (!looksLikeData) continue;

    if (row[0] != null) currentDate = toIsoDate(row[0]);
    if (row[1] != null) currentShift = toNullableString(row[1]);
    if (!currentDate || !currentShift) continue;

    const shift = currentShift === "AM" || currentShift === "PM" ? currentShift : "Overtime";

    await db.insert(shiftReportEntries).values({
      reportDate: currentDate,
      shift: shift as "AM" | "PM" | "Overtime",
      orderNumber: String(orderNumberRaw).trim(),
      workCenter: toNullableString(row[6]),
      uic: toNullableString(row[7]),
      ops: toNullableString(row[10]),
      activity: toNullableString(row[11]),
      planMhrs: toNullableNumber(row[8])?.toString() ?? null,
      consumedMhrs: toNullableNumber(row[9])?.toString() ?? null,
      manhours: toNullableNumber(row[16])?.toString() ?? null,
      progressPct: toNullableNumber(row[13]),
      stampPct: toNullableNumber(row[14]),
      completenessStatus: toNullableString(row[17]),
      remark: toNullableString(row[18]),
    });
    imported++;
  }
  console.log(`End Shift Report: imported ${imported} entries (of ${dataRows.length} data rows detected)`);
}

async function main() {
  const only = process.argv[2]; // "orders" | "shift" | undefined (both)
  if (only !== "shift") await importMainDatabase();
  if (only !== "orders") await importShiftReport();
  console.log("Import complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
