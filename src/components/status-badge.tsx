import { cn, statusColorKey, tierColorKey } from "@/lib/utils";

const COLOR_CLASSES: Record<string, string> = {
  "status-open": "bg-status-open/15 text-status-open",
  "status-progress": "bg-status-progress/15 text-status-progress",
  "status-closed": "bg-status-closed/15 text-status-closed",
  "status-waiting": "bg-status-waiting/15 text-status-waiting",
  "status-urgent": "bg-status-urgent/15 text-status-urgent",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = statusColorKey(status);
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        COLOR_CLASSES[key],
      )}
    >
      {status || "Open"}
    </span>
  );
}

export function TierBadge({ tier }: { tier: number | null | undefined }) {
  const key = tierColorKey(tier);
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        COLOR_CLASSES[key],
      )}
    >
      Tier {tier ?? 3}
    </span>
  );
}
