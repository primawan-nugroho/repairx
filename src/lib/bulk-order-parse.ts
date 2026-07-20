// Column order for pasted Excel rows — shown as a hint in the bulk-add dialog. Only
// Order number is required; a pasted row can have fewer trailing columns.
export const BULK_ORDER_COLUMNS = [
  "Order number",
  "Description",
  "Serial number",
  "Engine type",
  "Date in",
  "Work center",
  "Location",
  "Remark",
] as const;

export interface BulkOrderRow {
  orderNumber: string;
  description: string;
  serialNumber: string;
  engineType: string;
  dateIn: string;
  workCenter: string;
  location: string;
  remark: string;
}

export function blankBulkOrderRow(): BulkOrderRow {
  return {
    orderNumber: "",
    description: "",
    serialNumber: "",
    engineType: "",
    dateIn: "",
    workCenter: "",
    location: "",
    remark: "",
  };
}

/** Accepts both the app's own DD-MM-YYYY display format and Excel's native
 * YYYY-MM-DD — never guesses on anything else, so a malformed date becomes blank
 * rather than silently wrong (see the Excel-epoch date bug fixed elsewhere). */
function parseFlexibleDate(raw: string): string {
  const value = raw.trim();
  if (!value) return "";

  const ddmmyyyy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(value);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const day = Number(d);
    const month = Number(m);
    const year = Number(y);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return "";
  }

  const isoLike = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (isoLike) {
    const [, y, m, d] = isoLike;
    return `${y}-${String(Number(m)).padStart(2, "0")}-${String(Number(d)).padStart(2, "0")}`;
  }

  return "";
}

function matchEngineType(raw: string, engineTypes: string[]): string {
  const value = raw.trim();
  if (!value) return "";
  if (engineTypes.includes(value)) return value;
  const upper = value.toUpperCase();
  const match = engineTypes.find((t) => t.toUpperCase() === upper);
  return match ?? "";
}

/** Splits pasted Excel text into rows (tab-separated columns, one order per line).
 * Blank lines are skipped. Rows shorter than 8 columns just leave the trailing
 * fields blank — a paste of only "Order number" and "Description" is valid. */
export function parseBulkOrderText(text: string, engineTypes: string[]): BulkOrderRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line.split("\t").map((c) => c.trim());
      return {
        orderNumber: cells[0] ?? "",
        description: cells[1] ?? "",
        serialNumber: cells[2] ?? "",
        engineType: matchEngineType(cells[3] ?? "", engineTypes),
        dateIn: parseFlexibleDate(cells[4] ?? ""),
        workCenter: cells[5] ?? "",
        location: cells[6] ?? "",
        remark: cells[7] ?? "",
      };
    });
}
