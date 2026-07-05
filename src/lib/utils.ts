export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

const STATUS_COLOR_MAP: Record<string, string> = {
  OPEN: "status-open",
  PROGRESS: "status-progress",
  URGENT: "status-urgent",
  "TOP URGENT": "status-urgent",
  CLOSED: "status-closed",
  "FINAL CONFIRM": "status-closed",
  INPROGRESS: "status-progress",
};

export function statusColorKey(status: string | null | undefined): string {
  if (!status) return "status-open";
  const upper = status.toUpperCase().trim();
  if (upper.startsWith("W/F")) return "status-waiting";
  return STATUS_COLOR_MAP[upper] ?? "status-open";
}

export function tierColorKey(tier: number | null | undefined): string {
  if (tier === 1) return "status-urgent";
  if (tier === 2) return "status-waiting";
  return "status-open";
}
