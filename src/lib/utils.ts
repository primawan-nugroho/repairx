import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Upgraded from a plain filter+join to clsx+tailwind-merge (the shadcn/ui
// convention) so conflicting Tailwind classes resolve correctly (e.g. a caller
// overriding a default `p-4` with `p-2` keeps only `p-2`) — a strict superset of
// every existing call site, which only ever passed plain strings/falsy values.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Numeric DD-MM-YYYY, dash-separated — the "date-month-year" format requested for
 * every displayed date in the app (previously day + abbreviated month name). */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}-${get("month")}-${get("year")}`;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  // Canonical order statuses (see lib/order-status.ts)
  READY: "status-closed",
  "PARTIALLY READY": "status-progress",
  "PENDING RAW MATERIAL": "status-waiting",
  "PENDING BDP": "status-waiting",
  "PENDING DECISION": "status-waiting",
  "PENDING TOOLING": "status-waiting",
  COMPLETED: "status-closed",
  CANCELLED: "status-urgent",
  // Canonical shift-entry statuses
  "IN PROGRESS": "status-progress",
  // Legacy values retained so historical rows still colour correctly
  OPEN: "status-open",
  PROGRESS: "status-progress",
  URGENT: "status-urgent",
  "TOP URGENT": "status-urgent",
  CLOSED: "status-closed",
  "FINAL CONFIRM": "status-closed",
  INPROGRESS: "status-progress",
  WIP: "status-waiting",
};

export function statusColorKey(status: string | null | undefined): string {
  if (!status) return "status-open";
  const upper = status.toUpperCase().trim();
  if (upper.startsWith("W/F")) return "status-waiting";
  return STATUS_COLOR_MAP[upper] ?? "status-open";
}

/** Conditional-formatting bands for a 0-100 progress value, reusing the same
 * semantic status hues: barely started reads as urgent (red), mid-progress as
 * waiting (amber), nearly done as progress (blue), complete as closed (green). */
export function progressColorKey(pct: number | null | undefined): string {
  const value = pct ?? 0;
  if (value >= 100) return "status-closed";
  if (value >= 76) return "status-progress";
  if (value >= 26) return "status-waiting";
  return "status-urgent";
}

export function tierColorKey(tier: number | null | undefined): string {
  if (tier === 1) return "status-urgent";
  if (tier === 2) return "status-waiting";
  return "status-open";
}

const PERSON_COLOR_SLUGS = ["uic-a", "uic-b", "uic-c", "uic-d", "uic-e", "uic-f", "uic-g", "uic-h", "uic-i", "uic-j"];

/** Deterministic categorical color for a free-text name (e.g. an assignee), reusing
 * the existing 10-hue categorical palette. Unlike the UIC mapping, this isn't backed
 * by a fixed lookup table — any string hashes to a stable color, so new names don't
 * need a manual mapping update. */
export function personColorKey(name: string | null | undefined): string {
  if (!name) return "unmapped";
  const trimmed = name.trim();
  if (!trimmed) return "unmapped";
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % PERSON_COLOR_SLUGS.length;
  return PERSON_COLOR_SLUGS[index] ?? "unmapped";
}

/** Assigns each name in `names` the next color slot in turn (rather than hashing),
 * so that within one known roster every name gets a distinct hue — hashing alone can
 * collide two names onto the same slot even when there's room for both to differ. */
export function buildPersonColorMap(names: Array<string | null | undefined>): Record<string, string> {
  const map: Record<string, string> = {};
  let next = 0;
  for (const raw of names) {
    const name = raw?.trim();
    if (!name || name in map) continue;
    map[name] = PERSON_COLOR_SLUGS[next % PERSON_COLOR_SLUGS.length] ?? "unmapped";
    next += 1;
  }
  return map;
}
