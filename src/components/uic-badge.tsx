import { cn, personColorKey } from "@/lib/utils";
import { uicColorKey, wcColorKey } from "@/lib/wc-uic-map";

export const CATEGORICAL_COLOR_CLASSES: Record<string, string> = {
  "uic-a": "bg-uic-a/15 text-uic-a",
  "uic-b": "bg-uic-b/15 text-uic-b",
  "uic-c": "bg-uic-c/15 text-uic-c",
  "uic-d": "bg-uic-d/15 text-uic-d",
  "uic-e": "bg-uic-e/15 text-uic-e",
  "uic-f": "bg-uic-f/15 text-uic-f",
  "uic-g": "bg-uic-g/15 text-uic-g",
  "uic-h": "bg-uic-h/15 text-uic-h",
  "uic-i": "bg-uic-i/15 text-uic-i",
  "uic-j": "bg-uic-j/15 text-uic-j",
  unmapped: "bg-uic-unmapped/15 text-uic-unmapped",
};

export function UicBadge({ uic }: { uic: string | null | undefined }) {
  if (!uic) return <span className="text-text-tertiary">-</span>;
  const key = uicColorKey(uic);
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        CATEGORICAL_COLOR_CLASSES[key],
      )}
    >
      {uic}
    </span>
  );
}

export function WorkCenterBadge({
  workCenter,
  onClick,
}: {
  workCenter: string | null | undefined;
  onClick?: () => void;
}) {
  if (!workCenter) return <span className="text-text-tertiary">-</span>;
  const key = wcColorKey(workCenter);
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        onClick && "cursor-pointer hover:ring-2 hover:ring-current/30",
        CATEGORICAL_COLOR_CLASSES[key],
      )}
    >
      {workCenter}
    </Comp>
  );
}

/** Same categorical palette, applied to a free-text name (e.g. a job assignee)
 * instead of a work center/UIC — see personColorKey. */
export function PersonBadge({ name }: { name: string | null | undefined }) {
  if (!name) return <span className="text-text-tertiary">-</span>;
  const key = personColorKey(name);
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        CATEGORICAL_COLOR_CLASSES[key],
      )}
    >
      {name}
    </span>
  );
}
